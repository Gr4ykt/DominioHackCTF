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

export type VpnStatus = {
  has_config: boolean
  assigned_ip: string | null
  connected: boolean
  last_handshake: string | null
}

export type Difficulty = "easy" | "medium" | "hard"

export type MachineProgress = {
  user_flag_obtained: boolean
  root_flag_obtained: boolean
  is_complete: boolean
  writeup_unlocked: boolean
}

export type Machine = {
  id: string
  slug: string
  name: string
  description: string
  difficulty: Difficulty
  os: string
  points: number
  category: string
  docker_internal_port: number
  is_active?: boolean
  progress: MachineProgress
}

export type LabStatus = {
  status: "none" | "starting" | "active" | "expiring"
  machine_slug: string | null
  lab_ip: string | null
  internal_port: number | null
  expires_at: string | null
  seconds_left: number | null
  extensions_used: number
}

export type FlagResult = {
  correct: boolean
  type?: "user" | "root"
  points_awarded?: number
  already_owned?: boolean
  machine_complete?: boolean
}
