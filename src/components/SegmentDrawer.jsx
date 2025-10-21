// src/components/SegmentDrawer.jsx
import { useEffect, useRef, useState } from 'react'
import { Polyline, CircleMarker, useMap } from 'react-leaflet'
import { fetchRoadsForBounds, snapToNearestRoad } from '../lib/roads'

const DEBOUNCE_MS = 500
const MAX_SNAP_METERS = 30

export default function SegmentDrawer({ active, onComplete }) {
  const map = useMap()
  const [firstPt, setFirstPt] = useState(null)   // [lat,lng]
  const [hoverPt, setHoverPt] = useState(null)   // [lat,lng]
  const [wayId, setWayId]   = useState(null)
  const [roads, setRoads]   = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  const refreshRoads = async () => {
    if (!active) return
    setLoading(true)
    try {
      const segs = await fetchRoadsForBounds(map.getBounds())
      setRoads(segs || [])
    } finally {
      setLoading(false)
    }
  }

  // Reset/carga al activar
  useEffect(() => {
    if (!active) {
      setFirstPt(null); setHoverPt(null); setWayId(null); setRoads([]); setLoading(false)
      return
    }
    refreshRoads()
    map._container.style.cursor = ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Auto refresh en pan/zoom (debounce)
  useEffect(() => {
    if (!active) return
    const onMoveEnd = () => {
      clearTimeout(timerRef.current)
      timerRef.current = setTimeout(refreshRoads, DEBOUNCE_MS)
    }
    map.on('moveend', onMoveEnd)
    return () => { map.off('moveend', onMoveEnd); clearTimeout(timerRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  // Preview con mouse/touch (snap + misma calle)
  useEffect(() => {
    if (!active) return
    const handleMove = (e) => {
      if (!firstPt || !roads.length) return setHoverPt(null)
      const snapped = snapToNearestRoad(e.latlng.lat, e.latlng.lng, roads)
      const valid = snapped && snapped.distance <= MAX_SNAP_METERS &&
                    (!wayId || snapped.wayId === wayId)
      if (valid) {
        setHoverPt([snapped.lat, snapped.lng])
        map._container.style.cursor = 'crosshair'
      } else {
        setHoverPt(null)
        map._container.style.cursor = 'not-allowed'
      }
    }
    map.on('mousemove', handleMove)
    map.on('touchmove', handleMove) // soporte táctil básico
    return () => {
      map.off('mousemove', handleMove)
      map.off('touchmove', handleMove)
      map._container.style.cursor = ''
    }
  }, [active, firstPt, roads, wayId, map])

  // Clics: fija inicio y fin; valida misma calle y dispara onComplete
  useEffect(() => {
    if (!active) return
    const onClick = (e) => {
      if (!roads.length) return
      const snapped = snapToNearestRoad(e.latlng.lat, e.latlng.lng, roads)
      if (!snapped || snapped.distance > MAX_SNAP_METERS) {
        map._container.style.cursor = 'not-allowed'
        setTimeout(()=> (map._container.style.cursor = ''), 250)
        return
      }
      if (!firstPt) { // primer puntero
        setFirstPt([snapped.lat, snapped.lng])
        setWayId(snapped.wayId || null)
        return
      }
      if (wayId && snapped.wayId !== wayId) { // debe ser misma calle
        map._container.style.cursor = 'not-allowed'
        setTimeout(()=> (map._container.style.cursor = ''), 250)
        return
      }
      const second = [snapped.lat, snapped.lng]
      onComplete({ start: firstPt, end: second, wayId: snapped.wayId })
      // limpiar para siguiente trazo
      setFirstPt(null); setHoverPt(null); setWayId(null)
    }
    map.on('click', onClick)
    return () => map.off('click', onClick)
  }, [active, roads, firstPt, wayId, onComplete, map])

  // Indicador pequeño de carga
  if (!firstPt && loading) {
    return (
      <div style={{
        position:'absolute', right:12, bottom:12, zIndex:1002,
        background:'#0d1328', border:'1px solid #1f2937', color:'#cbd5e1',
        padding:'6px 8px', borderRadius:8, fontSize:12
      }}>
        Cargando calles…
      </div>
    )
  }

  // Render: punteros + línea punteada de preview
  return (
    <>
      {firstPt && (
        <CircleMarker center={firstPt} radius={6} pathOptions={{ color: '#3b82f6', weight: 3, fillOpacity: 0.9 }} />
      )}
      {hoverPt && (
        <CircleMarker center={hoverPt} radius={6} pathOptions={{ color: '#ef4444', weight: 3, fillOpacity: 0.9 }} />
      )}
      {firstPt && hoverPt && (
        <Polyline
          positions={[firstPt, hoverPt]}
          pathOptions={{
            color: '#ef4444',
            weight: 6,
            opacity: 0.7,
            dashArray: '8 8' // ← línea punteada
          }}
        />
      )}
    </>
  )
}
