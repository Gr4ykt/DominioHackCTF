import { api } from "../main"
import type { FlagResult, LabStatus } from "../types"

export const labs = {
  status() {
    return api.get<LabStatus>("/labs/status").then((r) => r.data)
  },
  start(machineId: string) {
    return api
      .post<LabStatus>("/labs/start", { machine_id: machineId })
      .then((r) => r.data)
  },
  stop() {
    return api.post<{ stopped: boolean }>("/labs/stop").then((r) => r.data)
  },
  extend() {
    return api.post<LabStatus>("/labs/extend").then((r) => r.data)
  },
  submitFlag(flag: string) {
    return api.post<FlagResult>("/labs/flag", { flag }).then((r) => r.data)
  },
}
