// src/components/AnnouncementsList.jsx
import { useEffect, useMemo, useState } from 'react'
import { onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { colAnnouncements } from '../lib/firebase'

export default function AnnouncementsList({ onClose, search = '' }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    const qy = query(colAnnouncements, orderBy('createdAt', 'desc'), limit(100))
    const unsub = onSnapshot(qy, snap => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const list = useMemo(() => {
    const s = search.toLowerCase()
    return items.filter(a => (
      (a.title || '').toLowerCase().includes(s) ||
      (a.text  || '').toLowerCase().includes(s)
    ))
  }, [items, search])

  return (
    <div style={{padding:'12px', paddingTop:8}}>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
        <button className="chip" onClick={onClose}>← Volver al mapa</button>
        <div style={{fontWeight:700, color:'#e2e8f0'}}>Avisos</div>
      </div>

      {list.length === 0 && (
        <div style={{color:'#94a3b8', fontSize:14}}>No hay avisos aún.</div>
      )}

      <div style={{display:'grid', gap:10}}>
        {list.map(a => (
          <div key={a.id} style={cardStyle}>
            <div style={{display:'flex', justifyContent:'space-between', gap:8}}>
              <div style={{fontWeight:700}}>
                {a.title || (a.text?.split('\n')[0] || 'Aviso')}
              </div>
              {a.createdAt?.toDate && (
                <small style={{color:'#94a3b8'}}>
                  {a.createdAt.toDate().toLocaleString()}
                </small>
              )}
            </div>
            {a.text && (
              <p style={{margin:'6px 0 0 0', lineHeight:1.4}}>
                {a.text}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const cardStyle = {
  background:'#0b1020',
  border:'1px solid #1f2937',
  color:'#e5e7eb',
  borderRadius:12,
  padding:'10px 12px',
  boxShadow:'0 4px 12px rgba(0,0,0,.25)'
}
