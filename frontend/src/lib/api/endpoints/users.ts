import { api } from "../main"
import type {
  LeaderboardItem,
  Paginated,
  PublicProfile,
  UpdateProfilePayload,
  UserProgress,
} from "../types"

export const users = {
  leaderboard(page = 1, limit = 20) {
    return api
      .get<Paginated<LeaderboardItem>>("/users/leaderboard", {
        params: { page, limit },
      })
      .then((r) => r.data)
  },
  progress(id: string) {
    return api.get<UserProgress>(`/users/${id}/progress`).then((r) => r.data)
  },
  updateProfile(id: string, payload: UpdateProfilePayload) {
    return api.patch<PublicProfile>(`/users/${id}`, payload).then((r) => r.data)
  },
}
