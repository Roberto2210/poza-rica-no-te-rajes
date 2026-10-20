# 🌊 Poza Rica No Te Rajes

**Mapa ciudadano en tiempo real para moverse por Poza Rica después de la inundación del río Cazones (octubre 2025).**

Cuando el río Cazones se desbordó el 10 de octubre de 2025, mucha gente no sabía qué calles seguían inundadas, cuáles estaban cerradas por escombro ni dónde estaban los centros de acopio. En los días siguientes construí esta app para que los propios vecinos reportaran el estado de las calles y se ayudaran a moverse por la ciudad.

> ⚠️ Iniciativa ciudadana independiente. La información la reportan los usuarios y no es oficial. En una emergencia llama al **911**.

## 📰 En los medios

La app fue usada por vecinos, brigadas ciudadanas y autoridades locales durante la emergencia, y fue cubierta por:

- [Milenio](https://www.milenio.com/virales/crean-app-reportar-calles-inundadas-veracruz-real)
- [Diario de Xalapa](https://oem.com.mx/diariodexalapa/local/ingeniero-crea-aplicacion-poza-rica-no-te-rajes-para-coordinar-ayuda-tras-inundaciones-26415914)
- [La Silla Rota](https://lasillarota.com/veracruz/estado/2025/10/21/joven-de-poza-rica-crea-pagina-web-para-monitorear-calles-avenidas-afectadas-por-inundacion-563708.html)
- [TV Azteca Veracruz](https://www.aztecaveracruz.com/noticias/como-se-llama-la-app-para-reportar-calles-inundadas-en-poza-rica/)
- [Notiver](https://www.notiver.com/primera/crea-veracruzano-app-para-apoyar-en-las-inundaciones-y-es-del-tecno-de-poza-rica/)
- [e-consulta Veracruz](https://historico.e-veracruz.mx/nota/2025-10-21/municipios/poza-rica-no-te-rajes-la-app-que-nacio-en-la-emergencia)

## ✨ Qué hace

| Color | Significado |
|---|---|
| 🟢 Verde | Calle transitable |
| 🔴 Rojo | Calle cerrada |
| 🟡 Amarillo | En limpieza o mantenimiento |
| 🔵 Azul | Punto de ayuda o centro de acopio |

- **Marcar tramos de calle:** tocas dos puntos en el mapa y la app traza el tramo afectado sobre la calle real.
- **Validación comunitaria:** cuando 3 personas votan que un tramo cerrado ya está abierto, pasa a *transitable*; si 3 votan *limpieza*, pasa a *en limpieza*. Así la información se corrige sola sin un moderador.
- **Reportes en tiempo real:** zonas inundadas, rutas seguras y centros de acopio aparecen al instante para todos.
- **Búsqueda de calles y lugares** con datos locales primero y respaldo en OpenStreetMap (Nominatim / Overpass).
- **Privacidad:** no pide registro ni guarda datos personales; cada dispositivo usa un identificador anónimo.
- **Anti-spam:** límite de reportes y votos por dispositivo, y reintentos con espera progresiva al escribir en la base de datos.

## 🛠️ Tecnologías

React 18 · Vite · Leaflet + React-Leaflet (OpenStreetMap) · Firebase Firestore (tiempo real) · Zustand · Docker · Railway

## 🚀 Correrlo en local

```bash
git clone https://github.com/Roberto2210/poza-rica-no-te-rajes.git
cd poza-rica-no-te-rajes
cp .env.example .env.local   # pon aquí la configuración de tu proyecto de Firebase
npm install
npm run dev
```

Necesitas un proyecto de Firebase con **Firestore** habilitado.

## 📁 Estructura

```
src/
├── App.jsx              # mapa, reportes y votación
├── components/          # MapView, ReportForm, SegmentDrawer, BottomSheet…
└── lib/
    ├── firebase.js      # conexión a Firestore
    ├── roads.js         # ajuste de tramos a calles reales
    ├── search.js        # búsqueda local + OpenStreetMap
    ├── rateLimit.js     # límite de acciones por dispositivo
    └── retry.js         # reintentos con espera progresiva
public/
├── streets.geojson      # calles de Poza Rica
└── places.json          # lugares para la búsqueda
```

## 👤 Autor

**Roberto Miguel Baños Cordero** — Ingeniero en Mecatrónica (ITSPR), desarrollador full-stack.
[GitHub](https://github.com/Roberto2210)

> *"La unión y la tecnología nos ayudan a salir adelante."*
