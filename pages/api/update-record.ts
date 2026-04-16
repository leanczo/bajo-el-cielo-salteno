import type { NextApiRequest, NextApiResponse } from 'next'
import path from 'path'
import fs from 'fs'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const {
    _nombre,
    _localidad,
    nombre,
    localidad,
    cantidad,
    alturaMaxima,
    observacion,
    dificultad,
    distancia,
    desnivel,
    url,
  } = req.body

  // _nombre/_localidad are the original lookup keys; fallback to nombre/localidad for backwards compat
  const lookupNombre = _nombre ?? nombre
  const lookupLocalidad = _localidad ?? localidad

  if (!lookupNombre || !lookupLocalidad) {
    return res.status(400).json({ error: 'nombre y localidad son requeridos' })
  }

  const filePath = path.join(process.cwd(), 'data', 'recordsData.json')

  let records: Record<string, unknown>[]
  try {
    records = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return res.status(500).json({ error: 'No se pudo leer el archivo de datos' })
  }

  const idx = records.findIndex((r) => r.nombre === lookupNombre && r.localidad === lookupLocalidad)
  if (idx === -1) {
    return res.status(404).json({ error: 'Registro no encontrado' })
  }

  if (nombre !== undefined) records[idx].nombre = nombre
  if (localidad !== undefined) records[idx].localidad = localidad
  if (cantidad !== undefined) records[idx].cantidad = cantidad
  if (alturaMaxima !== undefined) records[idx].alturaMaxima = alturaMaxima
  if (observacion !== undefined) records[idx].observacion = observacion
  if (dificultad !== undefined) records[idx].dificultad = dificultad
  if (distancia !== undefined) records[idx].distancia = distancia
  if (desnivel !== undefined) records[idx].desnivel = desnivel
  if (url !== undefined) records[idx].url = url

  try {
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2))
  } catch {
    return res.status(500).json({ error: 'No se pudo guardar. ¿Estás en producción?' })
  }

  return res.status(200).json(records[idx])
}
