import { api } from "../main"
import type { VpnStatus } from "../types"

// Dispara la descarga de un Blob como archivo en el navegador.
function saveBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const FILENAME = "dominiohackctf.conf"

export const vpn = {
  status() {
    return api.get<VpnStatus>("/vpn/status").then((r) => r.data)
  },

  // Cada descarga genera llaves nuevas e invalida el .conf anterior:
  // llamar solo en una acción explícita del usuario, no al cargar la página.
  async download() {
    const { data } = await api.get<Blob>("/vpn/config", {
      responseType: "blob",
    })
    saveBlob(data, FILENAME)
  },

  async regenerate() {
    const { data } = await api.post<Blob>(
      "/vpn/regenerate",
      null,
      { responseType: "blob" }
    )
    saveBlob(data, FILENAME)
  },
}
