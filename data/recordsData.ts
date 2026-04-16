import rawRecords from './recordsData.json'
import rawPending from './pendingData.json'

export type TrekkingRecord = {
  nombre: string
  localidad: string
  cantidad: number
  alturaMaxima: number | null
  observacion: string
  /** 1 = Fácil · 2 = Moderado · 3 = Difícil · 4 = Muy difícil · 5 = Extremo */
  dificultad: number | null
  /** Distancia en kilómetros */
  distancia: number | null
  /** Desnivel positivo en metros */
  desnivel: number | null
  /** URL de referencia (Wikiloc, AllTrails, etc.) */
  url: string | null
  /** Nombre del archivo GPX en public/gpx/ (sin extensión). Si no se especifica, se deriva de la URL. */
  gpx: string | null
}

export type PendingRecord = {
  nombre: string
  localidad: string
  alturaMaxima: number | null
  /** Distancia en kilómetros */
  distancia: number | null
  /** Desnivel positivo en metros */
  desnivel: number | null
  /** 1 = Fácil · 2 = Moderado · 3 = Difícil · 4 = Muy difícil · 5 = Extremo */
  dificultad: number | null
  /** URL de referencia (Wikiloc, AllTrails, etc.) */
  url: string | null
  observacion: string
}

export const recordsData = rawRecords as TrekkingRecord[]
export const pendingData = rawPending as PendingRecord[]
