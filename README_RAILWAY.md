# PozaRica – Addon de Producción para Railway (9.5/10)

## ¿Qué agrega?
- **Datos locales primero**: `streets.geojson` y `places.json` para *snap* y búsqueda sin depender de rate-limits.
- **Fallback** automático a Overpass/Nominatim si faltan datos locales.
- **Backoff de escrituras** a Firestore (`withRetry`).
- **Rate limit** simple por dispositivo para reportes y votos.
- **Dockerfile** listo para Railway (build estático).

## Cómo integrar (sin borrar nada)
1. Copia el contenido de este ZIP dentro de tu proyecto.
   - Reemplaza `src/lib/roads.js` por el que viene aquí (es compatible).
   - Deja `public/streets.geojson` y `public/places.json` (puedes ampliarlos luego).

2. En `src/App.jsx`:
   ```js
   import { localSearch, nominatimSearchOnline } from './lib/search'
   import { withRetry } from './lib/retry'
   import { allowAction } from './lib/rateLimit'

   // goToPlace:
   const goToPlace = async () => {
     let results = await localSearch(query)
     if (!results || results.length === 0) results = await nominatimSearchOnline(query)
     if (!results || results.length === 0) { alert('No se encontró la calle o colonia.'); return }
     const best = results[0]; setCenter([parseFloat(best.lat), parseFloat(best.lon)])
   }

   // onSubmit (antes de guardar):
   if (!allowAction('report', 15000)) { alert('Espera unos segundos para reportar de nuevo.'); return }
   await withRetry(() => addDoc(colReports, { ...payload, createdAt: serverTimestamp() }))

   // Crear segmento:
   await withRetry(() => addDoc(colSegments, data))

   // Votos:
   if (!allowAction('vote', 5000)) return
   await withRetry(() => updateDoc(doc(db,'segments',seg.id), patch))
   ```

3. Variables de entorno en Railway:
   - Copia `.env.example` y rellena las `VITE_FIREBASE_*` en *Variables*.
   - Deja `VITE_USE_LOCAL_DATA=1` para usar datos locales primero.

4. Despliegue en Railway:
   - Conecta tu repo y usa el `Dockerfile` de este paquete.
   - Railway expondrá tu app en el puerto que defina la variable `PORT` (ya manejado).

> Para máxima robustez, reemplaza `public/streets.geojson` con un extracto real de OSM (Poza Rica) y amplía `public/places.json` con más colonias/calles.
