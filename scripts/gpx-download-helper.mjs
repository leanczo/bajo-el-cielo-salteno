/**
 * GPX Download Helper
 *
 * Genera una página HTML con todos los links de descarga de Wikiloc.
 * Abrila en tu navegador mientras estás logueado en Wikiloc y descargá
 * cada archivo. Renombralos como {ID}.gpx y ponelos en public/gpx/
 *
 * Uso: node scripts/gpx-download-helper.mjs
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const data = JSON.parse(readFileSync(join(__dirname, '../data/recordsData.json'), 'utf-8'))

const records = data
  .filter((r) => r.url?.includes('wikiloc'))
  .map((r) => {
    const id = r.url.match(/(\d+)$/)?.[1]
    return { ...r, wikiloc_id: id }
  })
  .filter((r) => r.wikiloc_id)

const rows = records
  .map(
    (r) => `
  <tr>
    <td>${r.nombre}</td>
    <td>${r.localidad}</td>
    <td>
      <a href="https://es.wikiloc.com/wikiloc/downloadTrack.do?id=${r.wikiloc_id}"
         download="${r.wikiloc_id}.gpx"
         target="_blank">
        Descargar ${r.wikiloc_id}.gpx
      </a>
    </td>
  </tr>`
  )
  .join('')

const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Descarga GPX - Bajo el Cielo Salteño</title>
  <style>
    body { font-family: sans-serif; padding: 2rem; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background: #f3f4f6; }
    a { color: #0d9488; }
    .instructions {
      background: #fef3c7; border: 1px solid #fcd34d;
      padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;
    }
  </style>
</head>
<body>
  <h1>Descarga de archivos GPX (${records.length} rutas)</h1>
  <div class="instructions">
    <strong>Instrucciones:</strong>
    <ol>
      <li>Abrí esta página en tu navegador mientras estás logueado en Wikiloc.</li>
      <li>Hacé click en cada link para descargar el archivo GPX.</li>
      <li>Guardá los archivos en <code>public/gpx/</code> del proyecto.</li>
      <li>El nombre del archivo ya es correcto: <code>{ID}.gpx</code></li>
    </ol>
    <p>Tip: podés usar la extensión <strong>DownThemAll!</strong> (Firefox) para descargar todos de una vez.</p>
  </div>
  <table>
    <thead>
      <tr><th>Trekking</th><th>Localidad</th><th>Descarga</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`

const outPath = join(__dirname, '../gpx-downloads.html')
writeFileSync(outPath, html)
console.log(`✓ Página generada: gpx-downloads.html`)
console.log(`  Abrila en tu navegador mientras estás logueado en Wikiloc.`)
