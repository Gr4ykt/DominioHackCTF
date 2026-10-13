import { api } from "../main"
import type {
  AdminMachine,
  AdminUser,
  FlagInput,
  FlagMeta,
  MachineInput,
  Paginated,
  Role,
} from "../types"

export const admin = {
  users: {
    list(page = 1, limit = 50) {
      return api
        .get<Paginated<AdminUser>>(`/users?page=${page}&limit=${limit}`)
        .then((r) => r.data)
    },
    setRole(id: string, role: Role) {
      return api.patch<AdminUser>(`/users/${id}/role`, { role }).then((r) => r.data)
    },
    setActive(id: string, is_active: boolean) {
      return api
        .patch<AdminUser>(`/users/${id}/active`, { is_active })
        .then((r) => r.data)
    },
    remove(id: string) {
      return api.delete(`/users/${id}`)
    },
  },
  machines: {
    catalog() {
      return api.get<AdminMachine[]>("/machines/catalog").then((r) => r.data)
    },
    create(dto: MachineInput) {
      return api.post<AdminMachine>("/machines", dto).then((r) => r.data)
    },
    update(idOrSlug: string, dto: Partial<MachineInput>) {
      return api
        .patch<AdminMachine>(`/machines/${idOrSlug}`, dto)
        .then((r) => r.data)
    },
    toggle(idOrSlug: string) {
      return api.patch<AdminMachine>(`/machines/${idOrSlug}/toggle`).then((r) => r.data)
    },
    remove(idOrSlug: string) {
      return api.delete(`/machines/${idOrSlug}`)
    },
  },
  flags: {
    get(machineId: string) {
      return api.get<FlagMeta[]>(`/flags/${machineId}`).then((r) => r.data)
    },
    set(machineId: string, flags: FlagInput[]) {
      return api.put<FlagMeta[]>(`/flags/${machineId}`, { flags }).then((r) => r.data)
    },
  },
}
