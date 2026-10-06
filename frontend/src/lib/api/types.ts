export type Role = "superuser" | "admin" | "user"

export type User = {
  id: string
  username: string
  email: string
  role: Role
  avatar_url: string | null
  total_points: number
  created_at: string
}

export type AuthResponse = {
  access_token: string
  user: User
}

export type LoginPayload = {
  email: string
  password: string
}

export type RegisterPayload = {
  username: string
  email: string
  password: string
}
