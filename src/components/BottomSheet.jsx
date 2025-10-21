import { useFilter } from '../store'

export default function BottomSheet({ items=[] }){
  const { menuOpen, setMenuOpen } = useFilter()
  return (
    <div className={'bottomsheet '+(menuOpen? '' : 'closed')}>
      <div className="grabber" onClick={()=> setMenuOpen(!menuOpen)} />
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 12px 8px'}}>
        <strong>Reportes cercanos</strong>
        <button className="btn" style={{flex:'none', padding:'6px 10px'}} onClick={()=> setMenuOpen(!menuOpen)}>
          {menuOpen? 'Cerrar' : 'Abrir'}
        </button>
      </div>
      {menuOpen && (
        <div className="list">
          {items.map((it)=> (
            <div key={it.id} className="card">
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <strong>{label(it.type)}</strong>
                <small>{distanceLabel(it.distance)}</small>
              </div>
              <small>{it.note || 'Sin descripción'}</small><br/>
              <small>{it.address || (it.lat.toFixed(5)+', '+it.lng.toFixed(5))}</small>
            </div>
          ))}
        </div>
      )}
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
function distanceLabel(m){
  if (m == null) return ''
  if (m < 1000) return `${Math.round(m)} m`
  return (m/1000).toFixed(1)+' km'
}
