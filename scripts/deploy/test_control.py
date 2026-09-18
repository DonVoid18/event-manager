"""Pruebas del cambio de tráfico y recuperación; no usan una base de datos."""
import json
import io
import urllib.error
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from control import Controller, DeploymentError, atomic, error_message


class DiagnosticsTests(unittest.TestCase):
    def test_public_maintenance_accepts_http_error_503(self):
        controller = Controller.__new__(Controller)
        controller.url = "https://example.test"
        def maintenance(*args, **kwargs):
            raise urllib.error.HTTPError(controller.url, 503, "maintenance",
                                         {"X-Deployment-Release": "maintenance"}, io.BytesIO(b"maintenance"))
        with patch("control.urllib.request.urlopen", side_effect=maintenance) as request, patch("control.time.sleep"):
            controller.public_check(None)
        self.assertEqual(request.call_count, 3)

    def test_public_failure_reports_status_without_response_body(self):
        controller = Controller.__new__(Controller)
        controller.url = "https://example.test"
        def denied(*args, **kwargs):
            raise urllib.error.HTTPError(controller.url, 403, "secret", {}, io.BytesIO(b"secret"))
        with patch("control.urllib.request.urlopen", side_effect=denied), patch("control.time.sleep"), patch("sys.stdout", new_callable=io.StringIO) as output:
            with self.assertRaisesRegex(DeploymentError, "HTTP 403; se esperaba 503"):
                controller.public_check(None)
        self.assertNotIn("secret", output.getvalue())

    def test_unexpected_error_does_not_expose_values(self):
        try:
            raise ValueError("secret-database-password")
        except ValueError as error:
            message = error_message(error)
        self.assertIn("ValueError", message)
        self.assertNotIn("secret-database-password", message)

    def test_missing_docker_has_actionable_message(self):
        controller = Controller.__new__(Controller)
        controller.s = {"slots": {}}
        with patch("control.subprocess.run", side_effect=FileNotFoundError):
            with self.assertRaisesRegex(DeploymentError, "No se encuentra Docker"):
                controller.run(["docker", "compose", "version"])


class Fake(Controller):
    def __init__(self, directory):
        self.directory = Path(directory)
        self.state_file = self.directory / "state.json"
        self.s = {"format": 2, "phase": "idle", "active": "blue", "previous": None,
                  "candidate": None, "changed_at": 0, "slots": {"blue": {}}}
        self.events = []
        self.fail = None
        self.project = "fixture"
        self.save("idle")

    def event(self, event):
        self.events.append(event)
        if self.fail == event:
            raise DeploymentError("Fallo simulado")

    def prepare(self, reference):
        self.event(("prepare", reference))
        return {"image": "example/app@sha256:" + "a" * 64, "release": "b" * 40}

    def healthy(self, slot):
        self.event(("healthy", slot))

    def switch(self, slot):
        self.event(("switch", slot))

    def public_check(self, slot):
        self.event(("public", slot))

    def compose(self, *args):
        self.event(("compose", *args))
        return ""

    def migrate(self, slot):
        self.event(("migrate", slot))

    def check_session_secret(self, slot):
        self.event(("secret", slot))

    def run(self, args, timeout=240):
        self.event(("run", *args))
        return ""


class DeploymentTests(unittest.TestCase):
    def test_seed_requires_completed_deployment(self):
        self.c.s["active"] = None
        with self.assertRaises(DeploymentError):
            self.c.seed()
        self.assertEqual(self.c.events, [])

    def test_seed_uses_active_image_without_migrations(self):
        self.c.seed()
        self.assertEqual(self.c.events, [("compose", "run", "--rm", "--no-deps", "blue", "node",
                                         "node_modules/prisma/build/index.js", "db", "seed")])

    def test_seed_refuses_pending_operation(self):
        self.c.s["phase"] = "switching"
        with self.assertRaises(DeploymentError):
            self.c.seed()
        self.assertEqual(self.c.events, [])

    def test_seed_only_displays_generated_password(self):
        password_line = "Contraseña inicial generada: " + "a" * 32
        with patch.object(self.c, "compose", return_value="private-output\n" + password_line), patch("sys.stdout", new_callable=io.StringIO) as output:
            self.c.seed()
        self.assertIn(password_line, output.getvalue())
        self.assertNotIn("private-output", output.getvalue())

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.c = Fake(self.temporary.name)

    def deploy(self):
        self.c.deploy("example/app:version")

    def test_new_version_is_checked_before_switch(self):
        self.deploy()
        events = self.c.events
        self.assertLess(events.index(("healthy", "green")), events.index(("switch", "green")))
        self.assertEqual(self.c.s["active"], "green")
        self.assertEqual(self.c.s["previous"], "blue")
        self.assertFalse(any("stop" in e for e in events))

    def test_cannot_reuse_slot_during_drain(self):
        self.deploy()
        with self.assertRaises(DeploymentError):
            self.deploy()

    def test_unhealthy_candidate_never_receives_traffic(self):
        self.c.fail = ("healthy", "green")
        with self.assertRaises(DeploymentError):
            self.deploy()
        self.assertFalse(any(e[0] == "switch" for e in self.c.events))
        self.assertEqual(self.c.s["active"], "blue")
        self.c.recover()
        self.assertEqual(self.c.s["phase"], "idle")

    def test_public_failure_restores_healthy_previous(self):
        self.c.fail = ("public", "green")
        with self.assertRaises(DeploymentError):
            self.deploy()
        self.assertEqual(self.c.events[-3:], [("healthy", "blue"), ("switch", "blue"), ("public", "blue")])
        self.assertEqual(self.c.s["active"], "blue")

    def test_failed_migration_is_not_retried_automatically(self):
        self.c.fail = ("migrate", "green")
        with self.assertRaises(DeploymentError):
            self.deploy()
        self.assertEqual(json.loads(self.c.state_file.read_text())["phase"], "migrating")
        events = list(self.c.events)
        with self.assertRaises(DeploymentError):
            self.deploy()
        self.assertEqual(events, self.c.events)

    def test_unresolved_migration_remains_blocked(self):
        self.c.s.update(phase="migrating", candidate="green")
        self.c.fail = ("compose", "run", "--rm", "--no-deps", "green", "node",
                       "node_modules/prisma/build/index.js", "migrate", "status")
        with self.assertRaises(DeploymentError):
            self.c.recover()
        self.assertEqual(self.c.s["phase"], "migrating")

    def test_interrupted_switch_restores_origin(self):
        self.c.s.update(phase="switching", origin="blue")
        self.c.recover()
        self.assertEqual(self.c.s["phase"], "idle")
        self.assertIn(("switch", "blue"), self.c.events)

    def test_first_deploy_failure_restores_maintenance(self):
        self.c.s["active"] = None
        self.c.fail = ("public", "blue")
        with self.assertRaises(DeploymentError):
            self.deploy()
        self.assertIsNone(self.c.s["active"])
        self.assertIn(("switch", None), self.c.events)

    def test_rollback_does_not_route_to_unhealthy_app(self):
        self.c.s["previous"] = "green"
        self.c.fail = ("healthy", "green")
        with self.assertRaises(DeploymentError):
            self.c.rollback()
        self.assertFalse(any(e[0] == "switch" for e in self.c.events))

    def test_invalid_nginx_restores_file_without_reload(self):
        directory = self.c.directory / "nginx"
        directory.mkdir()
        config = directory / "default.conf"
        atomic(config, "previous configuration")
        self.c.render = lambda slot: "invalid configuration"
        self.c.fail = ("compose", "exec", "-T", "nginx", "nginx", "-t")
        with self.assertRaises(DeploymentError):
            Controller.switch(self.c, "green")
        self.assertEqual(config.read_text(), "previous configuration")
        self.assertFalse(any("reload" in e for e in self.c.events))

    @unittest.skipIf(__import__("os").name == "nt", "flock requiere Linux")
    def test_concurrent_operations_are_rejected(self):
        with self.c.lock():
            other = Fake(self.temporary.name)
            with self.assertRaises(DeploymentError):
                with other.lock():
                    pass


if __name__ == "__main__":
    unittest.main()
