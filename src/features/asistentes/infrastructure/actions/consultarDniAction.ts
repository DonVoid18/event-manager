"use server";

import { logServerError } from "@/shared/infrastructure/logging/serverLogger";
import { requireActiveSession, UnauthorizedError } from "@/shared/infrastructure/utils/authorization";

const DNI_API_URL = "https://ruc.andape.pe/api";
const REQUEST_TIMEOUT_MS = 8000;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getValidToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 5 * 60 * 1000) {
    return cachedToken.value;
  }

  const username = process.env.DNI_API_USERNAME;
  const password = process.env.DNI_API_PASSWORD;
  if (!username || !password) {
    throw new Error("La consulta de DNI no está configurada");
  }

  const response = await fetch(`${DNI_API_URL}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`No se pudo obtener el token de DNI (${response.status})`);
  }

  const payload: unknown = await response.json();
  const token =
    payload && typeof payload === "object" && "token" in payload && typeof payload.token === "string"
      ? payload.token
      : null;
  if (!token) {
    throw new Error("El proveedor de DNI no devolvió un token válido");
  }

  let expiresAt = Date.now() + 15 * 60 * 1000;
  try {
    const claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"));
    if (typeof claims.exp === "number") {
      expiresAt = claims.exp * 1000;
    }
  } catch {
    // El token puede no ser JWT; en ese caso se usa una caché breve.
  }

  cachedToken = { value: token, expiresAt };
  return token;
}

async function fetchDni(dni: string, token: string) {
  return fetch(`${DNI_API_URL}/v1/persona/dni/${dni}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

function parseNames(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("data" in payload)) return null;
  const data = payload.data;
  if (!data || typeof data !== "object") return null;

  if ("nombre_completo" in data && typeof data.nombre_completo === "string") {
    const [lastName, firstName] = data.nombre_completo.split(",", 2).map((part) => part.trim());
    if (firstName && lastName) return { firstName, lastName };
  }

  return null;
}

export async function consultarDniAction(dni: string) {
  try {
    await requireActiveSession();
    if (!/^\d{8}$/.test(dni)) {
      return { success: false, message: "El DNI debe tener exactamente 8 dígitos" };
    }

    let response = await fetchDni(dni, await getValidToken());
    if (response.status === 401) {
      cachedToken = null;
      response = await fetchDni(dni, await getValidToken());
    }

    if (response.status === 404) {
      return { success: false, message: "No se encontraron datos para este DNI. Completa los nombres manualmente." };
    }
    if (!response.ok) {
      throw new Error(`La consulta de DNI falló (${response.status})`);
    }

    const names = parseNames(await response.json());
    if (!names) {
      return { success: false, message: "No se encontraron nombres para este DNI. Complétalos manualmente." };
    }

    return { success: true, message: "Datos del DNI completados", data: names };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return { success: false, message: error.message };
    }

    await logServerError({
      error,
      event: "asistentes.dni_lookup.failed",
      feature: "asistentes",
      operation: "consultar_dni",
    });
    return { success: false, message: "No se pudo consultar el DNI. Completa los nombres manualmente o vuelve a intentar." };
  }
}
