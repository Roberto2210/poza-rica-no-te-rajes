// Local-first streets + snap helpers for PozaRica
const OVERPASS = 'https://overpass-api.de/api/interpreter'
const HWY = [
  'motorway','trunk','primary','secondary','tertiary',
  'unclassified','residential','living_street','service'
]
const memory = new Map()

async function loadLocalStreets() {
  try {
    const resp = await fetch('/streets.geojson', { cache: 'force-cache' })
    if (!resp.ok) return null
    const data = await resp.json()
    if (!data || !data.features) return null
    const segments = []
    for (const f of data.features) {
      const coords = f.geometry?.coordinates || []
      for (let i=0; i<coords.length-1; i++) {
        const a = coords[i], b = coords[i+1]
        segments.push({ wayId: f.id || f.properties?.id || 'local', a: [a[1],a[0]], b: [b[1],b[0]] })
      }
    }
    return segments
  } catch (e) { return null }
}

export async function fetchRoadsForBounds(bounds){
  const s = bounds.getSouthWest(), n = bounds.getNorthEast()
  const padLat = (n.lat - s.lat) * 0.10
  const padLng = (n.lng - s.lng) * 0.10
  const south = s.lat - padLat, west  = s.lng - padLng
  const north = n.lat + padLat, east  = s.lng + (n.lng - s.lng) + padLng

  if (import.meta.env.VITE_USE_LOCAL_DATA == '1' || import.meta.env.VITE_USE_LOCAL_DATA == 1) {
    const local = await loadLocalStreets()
    if (local?.length) return local
  }

  const key = `${south.toFixed(3)},${west.toFixed(3)},${north.toFixed(3)},${east.toFixed(3)}`
  if (memory.has(key)) return memory.get(key)

  const filter = `(${HWY.map(h=>`way["highway"="${h}"](${south},${west},${north},${east});`).join('')});`
  const q = `[out:json][timeout:25];${filter}(._;>;);out body;`
  const resp = await fetch(OVERPASS, { method:'POST', body:q })
  if(!resp.ok) throw new Error('Overpass error')
  const data = await resp.json()

  const nodes = new Map()
  for(const el of data.elements) if(el.type==='node') nodes.set(el.id, [el.lat, el.lon])

  const roads = []
  for(const el of data.elements){
    if(el.type!=='way') continue
    const coords = el.nodes.map(id => nodes.get(id)).filter(Boolean)
    if (coords.length < 2) continue
    for(let i=0;i<coords.length-1;i++){
      roads.push({ wayId: el.id, a: coords[i], b: coords[i+1] })
    }
  }
  memory.set(key, roads)
  return roads
}

export async function fetchRoadsNear(lat, lng, radiusMeters = 300) {
  if (import.meta.env.VITE_USE_LOCAL_DATA == '1' || import.meta.env.VITE_USE_LOCAL_DATA == 1) {
    const local = await loadLocalStreets()
    if (local?.length) return local
  }
  const q = `
    [out:json][timeout:20];
    (
      ${HWY.map(h=>`way["highway"="${h}"](around:${radiusMeters},${lat},${lng});`).join('\n')}
    );
    (._;>;);
    out body;`
  const resp = await fetch(OVERPASS, { method:'POST', body:q })
  if(!resp.ok) throw new Error('Overpass error')
  const data = await resp.json()
  const nodes = new Map()
  for (const el of data.elements) if (el.type === 'node') nodes.set(el.id, [el.lat, el.lon])
  const segments = []
  for (const el of data.elements) {
    if (el.type !== 'way') continue
    const coords = el.nodes.map(id => nodes.get(id)).filter(Boolean)
    for (let i=0;i<coords.length-1;i++) {
      segments.push({ wayId: el.id, a: coords[i], b: coords[i+1] })
    }
  }
  return segments
}

function dist(a,b){
  const [lat1,lon1]=a, [lat2,lon2]=b
  const toRad = d=> d*Math.PI/180
  const R=6371008.8
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1)
  const t = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.min(1,Math.sqrt(t)))
}

export function snapToNearestRoad(lat, lng, segments){
  if(!segments?.length) return null
  let best = null
  const kx = 111320 * Math.cos(lat*Math.PI/180), ky = 110540
  const toXY = ([la,lo]) => [(la-lat)*ky, (lo-lng)*kx]
  const toLL = (x,y) => [lat + x/ky, lng + y/kx]
  const P = [0,0]
  for(const s of segments){
    const A = toXY(s.a), B = toXY(s.b)
    const AB = [B[0]-A[0], B[1]-A[1]]
    const AP = [P[0]-A[0], P[1]-A[1]]
    const len2 = AB[0]*AB[0]+AB[1]*AB[1]
    if(len2 === 0) continue
    let t = (AP[0]*AB[0] + AP[1]*AB[1]) / len2
    t = Math.max(0, Math.min(1, t))
    const proj = [A[0]+t*AB[0], A[1]+t*AB[1]]
    const d = Math.hypot(P[0]-proj[0], P[1]-proj[1])
    if (!best || d < best.dXY){
      const ll = toLL(proj[0], proj[1])
      best = { lat: ll[0], lng: ll[1], wayId: s.wayId, dXY:d }
    }
  }
  if (!best) return null
  best.distance = dist([lat,lng],[best.lat,best.lng])
  return best
}
