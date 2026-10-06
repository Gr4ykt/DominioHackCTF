import { API_URL, api, refreshAccessToken, setAccessToken } from "../main"
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from "../types"

export const auth = {
  async register(payload: RegisterPayload) {
    const { data } = await api.post<AuthResponse>("/auth/register", payload)
    setAccessToken(data.access_token)
    return data.user
  },

  async login(payload: LoginPayload) {
    const { data } = await api.post<AuthResponse>("/auth/login", payload)
    setAccessToken(data.access_token)
    return data.user
  },

  /** Recupera la sesión desde la cookie (al cargar la app o tras volver de Google). */
  refresh() {
    return refreshAccessToken()
  },

  async logout() {
    try {
      await api.post("/auth/logout")
    } finally {
      setAccessToken(null)
    }
  },

  async me() {
    const { data } = await api.get<User>("/auth/me")
    return data
  },

  /** El login con Google es una navegación completa, no una llamada axios. */
  googleUrl: `${API_URL}/auth/google`,
}
