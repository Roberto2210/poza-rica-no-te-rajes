import { useState } from 'react'

export default function ReportForm({ onCancel, onSubmit, coords, onSetCoords }) {
  const [type, setType] = useState('closed')
  const [note, setNote] = useState('')
  const [address, setAddress] = useState('')
  const [loadingGPS, setLoadingGPS] = useState(false)

  const create = () => onSubmit({ type, note, address, ...coords })

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Tu dispositivo no tiene GPS habilitado')
      return
    }
    setLoadingGPS(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLoadingGPS(false)
        const { latitude, longitude, accuracy } = pos.coords
        // si la precisión es pobre (>75m), intenta una segunda lectura rápida
        if (accuracy && accuracy > 75) {
          navigator.geolocation.getCurrentPosition(
            (p2) => onSetCoords?.({ lat: p2.coords.latitude, lng: p2.coords.longitude }),
            () => onSetCoords?.({ lat: latitude, lng: longitude }),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          )
        } else {
          onSetCoords?.({ lat: latitude, lng: longitude })
        }
      },
      (err) => {
        setLoadingGPS(false)
        alert('No se pudo obtener tu ubicación: ' + err.message)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    )
  }

  return (
    <div className="formbackdrop" onClick={onCancel}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>Nuevo reporte</h3>

        <div className="row">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="closed">Calle cerrada</option>
            <option value="open">Calle transitable</option>
            <option value="clean">Hace falta limpieza</option>
            <option value="aid">Punto de ayuda</option>
          </select>
        </div>

        <div className="row">
          <input
            placeholder="Dirección (opcional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button className="btn" onClick={useMyLocation} disabled={loadingGPS}>
            {loadingGPS ? 'Buscando…' : 'Mi ubicación'}
          </button>
        </div>

        {/* Muestra coordenadas si están disponibles */}
        {coords?.lat && coords?.lng && (
          <small style={{ color: '#94a3b8' }}>
            Ubicación seleccionada: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
          </small>
        )}

        <div className="row">
          <textarea
            placeholder="Descripción breve (opcional)"
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="actions">
          <button className="btn" onClick={onCancel}>Cancelar</button>
          <button className="btn primary" onClick={create}>Publicar</button>
        </div>
      </div>
    </div>
  )
}
