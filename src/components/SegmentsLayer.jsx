import { Polyline, Popup } from 'react-leaflet'

const colorByStatus = (s)=> ({
  closed: '#ef4444',
  clean:  '#f59e0b',
  open:   '#22c55e'
}[s] || '#ef4444')

export default function SegmentsLayer({ items=[], onVoteClean, onVoteOpen, onVoteClose }){
  return items.map(seg=> (
    <Polyline key={seg.id} positions={[[seg.startLat, seg.startLng],[seg.endLat, seg.endLng]]}
      pathOptions={{ color: colorByStatus(seg.status), weight: 6, opacity: .9 }}>
      <Popup>
        <div style={{minWidth:200}}>
          <strong>
            {seg.status==='closed' ? 'Tramo cerrado'
             : seg.status==='clean' ? 'En limpieza' : 'Transitable'}
          </strong><br/>
          <small>
            Votos limpieza: {seg.votesClean||0} ·
            Votos abrir: {seg.votesOpen||0} ·
            Votos cerrar: {seg.votesClose||0}
          </small>
          <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:8}}>
            <button onClick={()=> onVoteClean(seg)} style={btn}>Marcar limpieza</button>
            <button onClick={()=> onVoteOpen(seg)}  style={btn}>Marcar abierto</button>
            <button onClick={()=> onVoteClose(seg)} style={btn}>
              {seg.status==='open' ? 'Cerrar nuevamente' : 'Marcar cerrado'}
            </button>
          </div>
        </div>
      </Popup>
    </Polyline>
  ))
}

const btn = {
  padding:'6px 8px', border:'1px solid #1f2937',
  background:'#0b1020', color:'#e5e7eb', borderRadius:8, cursor:'pointer'
}
