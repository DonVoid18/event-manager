#!/usr/bin/env python3
"""Despliegue Blue-Green: un .env, una imagen y el mismo proyecto Compose."""
import contextlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
import traceback
import urllib.error
import urllib.parse
import urllib.request
try:
    import fcntl
except ImportError:
    fcntl = None

ROOT = Path(__file__).resolve().parents[2]


class DeploymentError(Exception):
    pass


def require(condition, message):
    if not condition:
        raise DeploymentError(message)


def error_message(error):
    if isinstance(error, DeploymentError):
        return str(error)
    # Mostrar ubicación y tipo, nunca valores, argumentos ni texto de la excepción.
    frames = traceback.extract_tb(error.__traceback__)
    location = f"control.py:{frames[-1].lineno}" if frames and Path(frames[-1].filename).resolve() == Path(__file__).resolve() else "dependencia del script"
    return f"Falló el despliegue ({type(error).__name__}, {location}). Comparte este mensaje para diagnosticarlo; no compartas .env."


def atomic(path, value):
    with tempfile.NamedTemporaryFile(mode="w", dir=path.parent, delete=False) as output:
        output.write(value)
        output.flush()
        os.fsync(output.fileno())
        name = output.name
    os.chmod(name, 0o644 if path.suffix == ".conf" else 0o600)
    os.replace(name, path)
    if os.name != "nt":
        fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)


class Controller:
    def __init__(self):
        require((ROOT / ".env").is_file(), "Falta .env. Copia .env.example y configura la aplicación.")
        self.directory = ROOT / ".deploy"
        self.directory.mkdir(exist_ok=True, mode=0o700)
        self.state_file = self.directory / "state.json"
        self.s = {"format": 2, "phase": "idle", "active": None, "previous": None,
                  "candidate": None, "slots": {}, "changed_at": 0}

    def run(self, args, timeout=240):
        # No imprimir salidas de Docker/Prisma que pudieran incluir credenciales.
        try:
            result = subprocess.run(args, cwd=ROOT, env=self.environment(),
                                    capture_output=True, text=True, timeout=timeout)
        except subprocess.TimeoutExpired:
            raise DeploymentError("Se agotó el tiempo de espera. Revisa status y recover.") from None
        except FileNotFoundError:
            raise DeploymentError("No se encuentra Docker. Instala Docker con Compose y comprueba docker compose version.") from None
        except PermissionError:
            raise DeploymentError("No se puede ejecutar Docker. Revisa los permisos del ejecutable y del usuario.") from None
        require(result.returncode == 0, "Falló una operación Docker/Prisma. Revisa la fase con bash deploy.sh status.")
        return result.stdout.strip()

    def environment(self):
        return {**os.environ, **{slot.upper() + "_IMAGE": release["image"]
                               for slot, release in self.s["slots"].items()}}

    def compose(self, *args):
        return self.run(["docker", "compose", "--env-file", ".env", "-f", "compose.prod.yml", *args])

    @contextlib.contextmanager
    def lock(self):
        require(fcntl is not None, "Ejecuta el despliegue en Linux con Docker y Python 3.")
        with (self.directory / "deploy.lock").open("a") as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                raise DeploymentError("Ya hay un despliegue en curso.") from None
            if self.state_file.exists():
                self.s = json.loads(self.state_file.read_text())
                require(self.s.get("format") == 2, "Este estado corresponde a otra versión del script; no se sobrescribirá.")
            yield

    def save(self, phase):
        self.s["phase"] = phase
        atomic(self.state_file, json.dumps(self.s, indent=2) + "\n")

    def configure(self):
        print("Validando configuración de .env y Docker Compose...", flush=True)
        # Compose interpreta .env, incluidas sus referencias ${DB_*}; nunca source/eval.
        config = json.loads(self.compose("config", "--format", "json"))
        self.project = config["name"]
        require(self.s.get("project", self.project) == self.project, "No cambies el nombre del proyecto Compose de una instalación existente.")
        self.s["project"] = self.project
        self.settings = config["services"]["blue"]["environment"]
        self.url = self.settings.get("NEXTAUTH_URL", "").rstrip("/")
        url = urllib.parse.urlsplit(self.url)
        require(url.scheme in ("http", "https") and url.hostname and not url.username and
                not url.query and not url.fragment and not url.path, "NEXTAUTH_URL debe ser la URL pública, sin ruta.")
        require(re.fullmatch(r"[A-Za-z0-9.-]+", url.hostname), "El dominio de NEXTAUTH_URL no es válido.")
        self.host, self.tls = url.hostname, url.scheme == "https"
        database = urllib.parse.urlsplit(self.settings.get("DATABASE_URL", ""))
        require(database.scheme in ("postgres", "postgresql") and database.hostname == "db" and database.port in (None, 5432) and
                urllib.parse.unquote(database.path.lstrip("/")) == self.settings.get("DB_NAME") and
                urllib.parse.unquote(database.username or "") == self.settings.get("DB_USERNAME") and
                urllib.parse.unquote(database.password or "") == self.settings.get("DB_PASSWORD"),
                "DATABASE_URL debe corresponder a DB_NAME/DB_USERNAME/DB_PASSWORD en db:5432.")
        require(len(self.settings.get("NEXTAUTH_SECRET", "")) >= 32, "Configura NEXTAUTH_SECRET con un valor aleatorio de al menos 32 caracteres.")
        require((ROOT / "private").is_dir(), "Prepara la carpeta private y sus permisos según README.")
        for folder in ("nginx", "assets"):
            (self.directory / folder).mkdir(exist_ok=True, mode=0o755)

    def render(self, slot, bootstrap=False):
        template = (ROOT / "docker/www/production/nginx.conf.template").read_text()
        tls = self.tls and not bootstrap
        transport = (f"listen 443 ssl;\n  ssl_certificate /etc/letsencrypt/live/{self.host}/fullchain.pem;\n"
                     f"  ssl_certificate_key /etc/letsencrypt/live/{self.host}/privkey.pem;\n"
                     "  ssl_protocols TLSv1.2 TLSv1.3;") if tls else "listen 80;"
        redirect = (f"server {{ listen 80; server_name {self.host}; location /.well-known/acme-challenge/ "
                    f"{{ root /var/www/html; }} location / {{ return 301 {self.url}$request_uri; }} }}") if tls else ""
        values = {"TRANSPORT": transport, "REDIRECT": redirect, "HOST": self.host,
                  "RELEASE": self.s["slots"][slot]["release"] if slot else "maintenance",
                  "BACKEND": f"proxy_pass http://{slot}:3000;" if slot else "return 503;"}
        for key, value in values.items():
            template = template.replace("@@" + key + "@@", value)
        return template

    def infrastructure(self):
        config = self.directory / "nginx/default.conf"
        if not config.exists():
            atomic(config, self.render(None, bootstrap=True))
        # Las actualizaciones de app no recrean infraestructura existente.
        for service in ("db", "nginx"):
            print(f"Comprobando infraestructura: {service}...", flush=True)
            if not self.compose("ps", "--all", "-q", service):
                print(f"Iniciando {service}; esperando a que esté disponible...", flush=True)
                self.compose("up", "-d", "--wait", "--wait-timeout", "120", service)
        print("Comprobando disponibilidad de PostgreSQL...", flush=True)
        self.compose("exec", "-T", "db", "pg_isready", "-q")

    def healthy(self, slot):
        self.compose("exec", "-T", slot, "node", "-e",
                     "fetch('http://127.0.0.1:3000/api/health/ready',{signal:AbortSignal.timeout(12000)}).then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))")

    def public_check(self, slot):
        expected = self.s["slots"][slot]["release"] if slot else "maintenance"
        # Tres respuestas consecutivas de la versión esperada; hasta 10 intentos.
        successes = 0
        detail = "No se recibieron suficientes respuestas consecutivas válidas."
        for attempt in range(10):
            try:
                request = urllib.request.Request(self.url + "/api/health/ready?probe=" + str(time.time_ns()),
                                                 headers={"Cache-Control": "no-cache", "Connection": "close"})
                try:
                    response = urllib.request.urlopen(request, timeout=12)
                except urllib.error.HTTPError as error:
                    response = error
                with response:
                    require(response.status == (200 if slot else 503),
                            f"HTTP {response.status}; se esperaba {200 if slot else 503}.")
                    require(response.headers.get("X-Deployment-Release") == expected,
                            "La cabecera X-Deployment-Release falta o no corresponde a la versión esperada.")
                    if slot:
                        payload = json.load(response)
                        require(isinstance(payload, dict) and payload.get("status") == "ok", "Readiness no disponible.")
                successes += 1
                if successes == 3:
                    return
            except Exception as error:
                if isinstance(error, DeploymentError):
                    detail = str(error)
                elif isinstance(error, urllib.error.URLError):
                    detail = f"Error de conexión/TLS ({type(error.reason).__name__})."
                elif isinstance(error, json.JSONDecodeError):
                    detail = "La respuesta no contiene JSON válido."
                else:
                    detail = f"Error en la comprobación ({type(error).__name__})."
                print(f"Comprobación pública {attempt + 1}/10: {detail}", flush=True)
                successes = 0
            time.sleep(1)
        raise DeploymentError(f"Falló la comprobación a través de la URL pública. {detail}")

    def switch(self, slot):
        path = self.directory / "nginx/default.conf"
        previous = path.read_text()
        atomic(path, self.render(slot))
        try:
            self.compose("exec", "-T", "nginx", "nginx", "-t")
            self.compose("exec", "-T", "nginx", "nginx", "-s", "reload")
        except Exception:
            atomic(path, previous)
            raise

    def prepare(self, reference):
        require(re.fullmatch(r"[a-zA-Z0-9][a-zA-Z0-9./:@_-]*", reference) and
                (":" in reference) and not reference.endswith(":latest"), "Usa usuario/imagen:version; no latest.")
        self.run(["docker", "pull", reference], timeout=600)
        info = json.loads(self.run(["docker", "image", "inspect", reference]))[0]
        release = info["Config"].get("Labels", {}).get("org.opencontainers.image.revision", "")
        require(re.fullmatch(r"[a-f0-9]{40}", release), "Construye la imagen con docker-build-push.ps1 (debe incluir el commit).")
        # Fija los bytes descargados aunque alguien cambie la etiqueta después.
        image = info["RepoDigests"][0]
        destination = self.directory / "assets" / release
        marker = self.directory / (release + ".image")
        if destination.exists():
            require(marker.exists() and marker.read_text() == info["Id"], "Ese commit ya tiene otra compilación; publica otro commit.")
        else:
            temporary = Path(tempfile.mkdtemp(prefix=".assets-", dir=self.directory))
            target = temporary / "_next/static"
            target.mkdir(parents=True)
            container = self.run(["docker", "create", image])
            try:
                self.run(["docker", "cp", container + ":/app/.next/static/.", str(target)])
                require(any(target.rglob("*.js")), "La imagen no contiene assets.")
                temporary.chmod(0o755)
                atomic(marker, info["Id"])
                os.replace(temporary, destination)
            finally:
                self.run(["docker", "rm", container])
        return {"image": image, "release": release}

    def migrate(self, slot):
        self.compose("run", "--rm", "--no-deps", "--name", self.project + "-migration",
                     slot, "node", "node_modules/prisma/build/index.js", "migrate", "deploy")

    def check_session_secret(self, slot):
        container = self.compose("ps", "-q", slot)
        current = json.loads(self.run(["docker", "inspect", container]))[0]
        environment = dict(value.split("=", 1) for value in current["Config"]["Env"])
        require(environment.get("NEXTAUTH_SECRET") == self.settings["NEXTAUTH_SECRET"],
                "Conserva NEXTAUTH_SECRET durante el despliegue para mantener las sesiones.")

    def restore(self):
        previous = self.s["origin"]
        if previous:
            self.healthy(previous)
        self.switch(previous)
        self.public_check(previous)
        self.s.update(active=previous, changed_at=time.time())
        self.save("idle")
        print("Tráfico restaurado. La base de datos no se ha revertido.")

    def deploy(self, reference):
        require(self.s["phase"] == "idle", "Hay una operación pendiente. Ejecuta status y recover.")
        require(time.time() - self.s["changed_at"] >= 60, "Espera un minuto entre cambios para terminar solicitudes en curso.")
        active = self.s["active"]
        if active:
            self.healthy(active)
            self.check_session_secret(active)
        slot = "green" if active == "blue" else "blue"
        release = self.prepare(reference)
        self.s["candidate"] = slot
        self.s["previous"] = None  # El slot anterior se reutiliza en este despliegue.
        self.s["slots"][slot] = release
        self.save("preparing")
        try:
            self.compose("run", "--rm", "--no-deps", slot, "node", "-e",
                         "const fs=require('fs'),p='/app/private/.probe-'+require('crypto').randomUUID();try{fs.writeFileSync(p,'ok',{flag:'wx'});if(fs.readFileSync(p,'utf8')!=='ok')throw Error()}finally{if(fs.existsSync(p))fs.unlinkSync(p)}")
            self.save("migrating")
            self.migrate(slot)
            self.save("starting")
            self.compose("up", "-d", "--no-deps", "--wait", "--wait-timeout", "180", slot)
            self.healthy(slot)
            self.s["origin"] = active
            self.save("switching")
            self.switch(slot)
            self.public_check(slot)
            self.s.update(active=slot, previous=active, candidate=None, changed_at=time.time())
            self.save("idle")
            print(f"Despliegue correcto: {slot}. La anterior queda disponible hasta el siguiente despliegue.")
        except Exception:
            if self.s["phase"] == "switching":
                self.restore()
            # Otras fases se conservan para no reintentar una migración a ciegas.
            raise

    def rollback(self):
        require(self.s["phase"] == "idle" and self.s["previous"], "No hay una versión anterior disponible.")
        require(time.time() - self.s["changed_at"] >= 60, "Espera un minuto para completar el drenaje.")
        active, target = self.s["active"], self.s["previous"]
        self.healthy(target)
        self.s["origin"] = active
        self.save("switching")
        try:
            self.switch(target)
            self.public_check(target)
        except Exception:
            self.restore()
            raise
        self.s.update(active=target, previous=active, changed_at=time.time())
        self.save("idle")
        print("Rollback correcto. La base de datos no se ha revertido.")

    def recover(self):
        phase = self.s["phase"]
        if phase == "switching":
            self.restore()
            return
        if phase == "migrating":
            running = self.run(["docker", "ps", "-q", "--filter", "name=^/" + self.project + "-migration$"])
            require(not running, "La migración sigue ejecutándose. No la repitas.")
            self.compose("run", "--rm", "--no-deps", self.s["candidate"], "node",
                         "node_modules/prisma/build/index.js", "migrate", "status")
        require(phase in ("idle", "preparing", "migrating", "starting"), "Estado desconocido; revisar antes de continuar.")
        self.save("idle")
        print("Estado recuperado. Puedes volver a ejecutar el despliegue.")

    def seed(self):
        require(self.s["phase"] == "idle", "Hay una operación pendiente. Ejecuta status y recover antes del seed.")
        active = self.s["active"]
        require(active and active in self.s["slots"], "Despliega una imagen correctamente antes de ejecutar el seed.")
        print("Ejecutando seeds de la imagen activa sobre la base configurada en .env...", flush=True)
        output = self.compose("run", "--rm", "--no-deps", active, "node",
                     "node_modules/prisma/build/index.js", "db", "seed")
        for line in output.splitlines():
            if re.fullmatch(r"Contraseña inicial generada: [A-Za-z0-9_-]{32}", line):
                print(line, flush=True)
        print("Seeds completados correctamente.", flush=True)

    def certificate(self, renew=False):
        require(self.s["phase"] == "idle", "Hay un despliegue pendiente.")
        print("Comprobando renovaciones con Certbot..." if renew else
              f"Solicitando o comprobando el certificado de {self.host} con Certbot...", flush=True)
        args = ["renew", "--webroot", "-w", "/var/www/html"] if renew else [
            "certonly", "--webroot", "-w", "/var/www/html", "--non-interactive",
            "--agree-tos", "--email", self.settings.get("SSL_EMAIL", ""), "-d", self.host]
        self.run(["docker", "compose", "--env-file", ".env", "-f", "compose.cert.yml",
                  "run", "--rm", "certbot", *args])
        print("Certbot terminó correctamente. Validando Nginx...", flush=True)
        self.compose("exec", "-T", "nginx", "nginx", "-t")
        print("Recargando Nginx...", flush=True)
        self.compose("exec", "-T", "nginx", "nginx", "-s", "reload")
        print("Proceso de certificados completado correctamente.", flush=True)
        if not self.s["active"]:
            print("Nginx permanece en mantenimiento. Para publicar la aplicación y activar HTTPS, "
                  "ejecuta bash deploy.sh usuario/imagen:version con NEXTAUTH_URL en HTTPS.", flush=True)


def main():
    if len(sys.argv) != 2:
        print("Uso: bash deploy.sh usuario/imagen:version | rollback | status | recover | certificate | renew | seed")
        return 1
    try:
        controller = Controller()
        with controller.lock():
            action = sys.argv[1]
            if action == "status":
                print(json.dumps(controller.s, indent=2))
            else:
                controller.configure()
                if action == "seed":
                    controller.seed()
                    return 0
                controller.infrastructure()
                if action in ("rollback", "recover"):
                    getattr(controller, action)()
                elif action in ("certificate", "renew"):
                    controller.certificate(action == "renew")
                else:
                    controller.deploy(action)
    except Exception as error:
        print(error_message(error), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
