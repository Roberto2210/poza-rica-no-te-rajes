// src/components/AnnouncementsBar.jsx
import { useEffect, useState } from 'react'
import { onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { colAnnouncements } from '../lib/firebase'

export default function AnnouncementsBar(){
  const [msg, setMsg] = useState(null)

  useEffect(()=>{
    // Escucha el último aviso
    const q = query(colAnnouncements, orderBy('createdAt','desc'), limit(1))
    const unsub = onSnapshot(q, snap=>{
      const d = snap.docs[0]?.data()
      // console.log('Announcements size:', snap.size, d) // ← descomenta para depurar
      setMsg(d || null)
    })
    return ()=> unsub()
  },[])

  if(!msg?.text) return null

  return (
    <div style={{
      position:'sticky', top:0, zIndex:1100,
      background:'#1e293b', color:'#e2e8f0',
      padding:'8px 12px',
      borderBottom:'1px solid #334155',
      fontSize:14
    }}>
      <strong>Aviso:</strong> {msg.text}
    </div>
  )
}
