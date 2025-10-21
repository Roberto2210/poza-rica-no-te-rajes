import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import UserMarker from './UserMarker'


const icons = {
  open: L.divIcon({ className:'icon open', html:'<div class="dot open"></div>' }),
  closed: L.divIcon({ className:'icon closed', html:'<div class="dot closed"></div>' }),
  clean: L.divIcon({ className:'icon clean', html:'<div class="dot clean"></div>' }),
  aid: L.divIcon({ className:'icon aid', html:'<div class="dot aid"></div>' }),
}

function Recenter({ center }){
  const map = useMap()
  useEffect(()=> { if(center) map.setView(center, 14) }, [center])
  return null
}

export default function MapView({ items, onTap, center, onLocate, children }){
  const pos = center || [20.5345, -97.4595] // Poza Rica
  return (
    <div className="mapwrap">
      <MapContainer center={pos} zoom={13} tap={true} style={{height:'100%', width:'100%'}}
        onClick={(e)=> onTap && onTap({ lat:e.latlng.lat, lng:e.latlng.lng })}>
        <TileLayer attribution='&copy; OpenStreetMap' url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />
        <Recenter center={center} />
        {items.map(r=> (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={icons[r.type] || icons.clean}>
            <Popup>
              <strong>{label(r.type)}</strong><br/>
              {r.note || 'Sin descripción'}<br/>
              {r.address || ''}
            </Popup>
          </Marker>
        ))}
          <UserMarker /> {/* ← aquí aparecerá tu monito azul */}
        {children}
      </MapContainer>
      <div className="legend">
        <div><span className="dot open"></span> Transitable</div>
        <div><span className="dot closed"></span> Cerrada</div>
        <div><span className="dot clean"></span> Limpieza</div>
        <div><span className="dot aid"></span> Ayuda</div>
      </div>
      <button className="gps" onClick={onLocate}>Mi ubicación</button>
    </div>
  )
}

function label(t){
  return ({
    open: 'Calle transitable',
    closed: 'Calle cerrada',
    clean: 'Hace falta limpieza',
    aid: 'Punto de ayuda'
  }[t] || 'Reporte')
}
