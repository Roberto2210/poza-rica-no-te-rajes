// src/components/UserMarker.jsx
import { useEffect, useState } from 'react'
import { Marker, useMap } from 'react-leaflet'
import L from 'leaflet'

// ícono tipo "monito"
const userIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077012.png',
  iconSize: [35, 35],
  iconAnchor: [17, 34],
  popupAnchor: [0, -30],
})

export default function UserMarker(){
  const map = useMap()
  const [pos, setPos] = useState(null)

  // seguimiento de ubicación actual
  useEffect(()=> {
    if (!navigator.geolocation) {
      console.warn('Geolocalización no soportada')
      return
    }

    const watcher = navigator.geolocation.watchPosition(
      (p)=> {
        const { latitude, longitude } = p.coords
        setPos([latitude, longitude])
        map.setView([latitude, longitude], map.getZoom(), { animate: false })
      },
      (err)=> console.warn('Error GPS:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )

    return ()=> navigator.geolocation.clearWatch(watcher)
  }, [map])

  if (!pos) return null
  return (
    <Marker position={pos} icon={userIcon}>
      <span></span>
    </Marker>
  )
}
