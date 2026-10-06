import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"

// Punto único de conexión con el backend NestJS. Los archivos de `endpoints/`
// solo declaran llamadas; toda la configuración y el manejo de sesión vive aquí.

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/v1"

const REFRESH_PATH = "/auth/refresh"
// Rutas donde un 401 es una respuesta legítima y no una sesión vencida.
const NO_REFRESH_PATHS = [REFRESH_PATH, "/auth/login", "/auth/register"]

export const api = axios.create({
  baseURL: API_URL,
  // Envía y recibe la cookie httpOnly del refresh token.
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

// El access token vive solo en memoria: no se guarda en localStorage ni en
// cookies legibles. Al recargar la página se recupera con /auth/refresh.
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken() {
  return accessToken
}

type AuthTokenResponse = { access_token: string }
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

// Una sola renovación a la vez: si varias peticiones reciben 401 juntas,
// todas esperan la misma promesa (el refresh token rota en cada uso).
let refreshing: Promise<string> | null = null

export function refreshAccessToken(): Promise<string> {
  refreshing ??= api
    .post<AuthTokenResponse>(REFRESH_PATH)
    .then(({ data }) => {
      accessToken = data.access_token
      return data.access_token
    })
    .catch((error: unknown) => {
      accessToken = null
      throw error
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const skip = NO_REFRESH_PATHS.some((path) => config?.url?.startsWith(path))

    if (error.response?.status !== 401 || !config || config._retried || skip) {
      throw error
    }

    // Access token vencido: se renueva y se repite la petición una sola vez.
    config._retried = true
    const token = await refreshAccessToken()
    config.headers.Authorization = `Bearer ${token}`
    return api(config)
  }
)

/** Forma de los errores del backend: `{ statusCode, message, error }`. */
export type ApiErrorBody = {
  statusCode: number
  message: string | string[]
  error?: string
}

/** Mensaje legible de un error de la API (los de validación llegan como lista). */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Ocurrió un error inesperado"
): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(". ")
    if (message) return message
    if (!error.response) return "No se pudo conectar con el servidor"
  }
  return fallback
}
