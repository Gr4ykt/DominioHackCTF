import { api } from "../main"
import type { Machine } from "../types"

export const machines = {
  list() {
    return api.get<Machine[]>("/machines").then((r) => r.data)
  },
  get(idOrSlug: string) {
    return api.get<Machine>(`/machines/${idOrSlug}`).then((r) => r.data)
  },
  writeup(idOrSlug: string) {
    return api
      .get<{ slug: string; lang: string; content: string }>(
        `/machines/${idOrSlug}/writeup`
      )
      .then((r) => r.data)
  },
}
