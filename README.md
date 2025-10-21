# PozaRica Mapa PRO (Tramos + Votos)

- **React + Vite + Leaflet (OpenStreetMap)**
- **Firebase Firestore** (tiempo real)
- **Tramos (segmentos)**: toca 2 puntos para marcar una calle cerrada.
- **Votación comunitaria**: si 3 personas marcan **Abrir**, el tramo pasa a **Transitable**; si estaba **Cerrado** y 3 marcan **Limpieza**, pasa a **En limpieza**.
- **Menú plegable** (abrir/cerrar) para la lista de reportes.

## Inicio
1) Crea un proyecto en Firebase y habilita **Firestore**.
2) Duplica `.env.example` -> `.env.local` con tus credenciales.
3) Instala y corre:
   ```bash
   npm i
   npm run dev
   ```

## Colecciones
- `reports`: puntos de ayuda/limpieza/cerradas/abiertas (como en la versión anterior).
- `segments`: tramos con estructura:
  ```js
  {
    startLat, startLng, endLat, endLng,
    status: 'closed'|'clean'|'open',
    votesOpen: 0, votesClean: 0,
    votersOpen: [], votersClean: [],
    createdAt, updatedAt
  }
  ```
