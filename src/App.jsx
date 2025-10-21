import { useEffect, useMemo, useState } from 'react'
import './styles.css'
import MapView from './components/MapView'
import BottomSheet from './components/BottomSheet'
import ReportForm from './components/ReportForm'
import SegmentDrawer from './components/SegmentDrawer'
import SegmentsLayer from './components/SegmentsLayer'
import AnnouncementsBar from './components/AnnouncementsBar'
import AnnouncementsList from './components/AnnouncementsList'
import { useFilter } from './store'

import { localSearch, nominatimSearchOnline } from './lib/search'
import { withRetry } from './lib/retry'
import { allowAction } from './lib/rateLimit'

import {
  db, colReports, colSegments,
  addDoc, serverTimestamp, onSnapshot, doc, updateDoc, increment
} from './lib/firebase'

import { fetchRoadsNear, snapToNearestRoad } from './lib/roads'

function useReports(filterType){
  const [items, setItems] = useState([])
  useEffect(()=> {
    const unsub = onSnapshot(colReports, (snap)=> {
      setItems(snap.docs.map(d=> ({ id:d.id, ...d.data() })))
    })
    return ()=> unsub()
  }, [])
  return useMemo(()=> {
    return items.filter(it=> filterType==='all' || it.type===filterType)
  }, [items, filterType])
}

function useSegments(){
  const [items, setItems] = useState([])
  useEffect(()=> {
    const unsub = onSnapshot(colSegments, (snap)=> {
      setItems(snap.docs.map(d=> ({ id:d.id, ...d.data() })))
    })
    return ()=> unsub()
  }, [])
  return items
}

function haversine(lat1, lon1, lat2, lon2){
  const toRad = (d)=> d*Math.PI/180
  const R = 6371008.8
  const dLat = toRad(lat2-lat1), dLon = toRad(lon2-lon1)
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2
  return 2*R*Math.asin(Math.min(1, Math.sqrt(a)))
}

function getDeviceId(){
  const k='deviceId'; let v=localStorage.getItem(k);
  if(!v){ v=(Math.random().toString(36).slice(2)+Date.now().toString(36)); localStorage.setItem(k,v) }
  return v
}

export default function App(){
  const [center, setCenter] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [tapCoords, setTapCoords] = useState(null)
  const [query, setQuery] = useState('')
  const { type, setType, menuOpen, setMenuOpen } = useFilter()

  const items = useReports(type)
  const segments = useSegments()
  const [drawSegment, setDrawSegment] = useState(false)
  const [view, setView] = useState('map') // 'map' | 'ann'

  const list = useMemo(()=> {
    return items.map(it=> ({
      ...it,
      distance: center ? haversine(center[0], center[1], it.lat, it.lng) : null
    })).sort((a,b)=> (a.distance||1e15) - (b.distance||1e15))
    .filter(it=> (it.address||'').toLowerCase().includes(query.toLowerCase()) || (it.note||'').toLowerCase().includes(query.toLowerCase()))
    .slice(0, 50)
  }, [items, center, query])

  const openFormAt = (coords)=> { setTapCoords(coords); setShowForm(true) }

  const onSubmit = async (payload)=> {
    // Rate limit anti-spam para reportes
    if (!allowAction('report', 15000)) {
      alert('Espera unos segundos para reportar de nuevo.')
      return
    }

    // Si es Punto de ayuda, encajar a calle cercana (máx 30 m)
    if (payload.type === 'aid' && payload.lat && payload.lng) {
      try {
        const segs = await fetchRoadsNear(payload.lat, payload.lng, 250) // radio 250 m
        const snapped = snapToNearestRoad(payload.lat, payload.lng, segs)
        if (!snapped || snapped.distance > 30) {
          alert('Coloca el Punto de ayuda sobre una calle (máx 30 m del asfalto).')
          return
        }
        payload.lat = snapped.lat
        payload.lng = snapped.lng
      } catch (e) {
        console.warn('No se pudo encajar a calle:', e)
        alert('No se pudo verificar la calle cercana. Intenta de nuevo.')
        return
      }
    }

    setShowForm(false)
    await withRetry(() =>
      addDoc(colReports, { ...payload, createdAt: serverTimestamp() })
    )
    setMenuOpen(true)
  }

  const locate = ()=> {
    if (!navigator.geolocation) return alert('Tu dispositivo no tiene GPS habilitado');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        if (accuracy && accuracy > 75) {
          navigator.geolocation.getCurrentPosition(
            (p2) => setCenter([p2.coords.latitude, p2.coords.longitude]),
            () => setCenter([latitude, longitude]),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
          );
        } else {
          setCenter([latitude, longitude]);
        }
      },
      (err) => alert('No se pudo obtener ubicación: ' + err.message),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  // Dejo tu función original por compatibilidad (no se quita nada)
  const nominatimSearch = async (q) => {
    if (!q?.trim()) return null;
    const params = new URLSearchParams({
      q,
      format: 'json',
      addressdetails: 1,
      countrycodes: 'mx',
      viewbox: '-97.60,20.65,-97.35,20.40',
      bounded: 1,
      limit: 5
    });
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'Accept-Language': 'es', 'User-Agent': 'PozaRicaMapa/1.0' }
    });
    if (!resp.ok) return null;
    return await resp.json();
  }

  const goToPlace = async () => {
    let results = await localSearch(query)
    if (!results || results.length === 0) {
      results = await nominatimSearchOnline(query)
    }
    if (!results || results.length === 0) {
      alert('No se encontró la calle o colonia. Intenta con otro nombre.')
      return
    }
    const best = results[0]
    setCenter([parseFloat(best.lat), parseFloat(best.lon)])
  }

  const ensureConsensus = async (seg, kind)=> {
    const nextOpen  = (seg.votesOpen  || 0) + (kind==='open'  ? 1 : 0)
    const nextClean = (seg.votesClean || 0) + (kind==='clean' ? 1 : 0)
    const nextClose = (seg.votesClose || 0) + (kind==='close' ? 1 : 0)

    if (nextOpen >= 3){
      await updateDoc(doc(db,'segments',seg.id), { status:'open',  updatedAt: serverTimestamp() })
    } else if (nextClose >= 3){
      await updateDoc(doc(db,'segments',seg.id), { status:'closed', updatedAt: serverTimestamp() })
    } else if (seg.status==='closed' && nextClean >= 3){
      await updateDoc(doc(db,'segments',seg.id), { status:'clean', updatedAt: serverTimestamp() })
    }
  }

  const onVoteClean = async (seg)=> {
    if (!allowAction('vote', 5000)) return
    const id = getDeviceId()
    const voted = seg.votersClean || []
    if (voted.includes(id)) return
    await withRetry(() =>
      updateDoc(doc(db,'segments',seg.id), {
        votesClean: increment(1),
        votersClean: [...voted, id],
        updatedAt: serverTimestamp()
      })
    )
    await ensureConsensus(seg,'clean')
  }

  const onVoteOpen = async (seg)=> {
    if (!allowAction('vote', 5000)) return
    const id = getDeviceId()
    const voted = seg.votersOpen || []
    if (voted.includes(id)) return
    await withRetry(() =>
      updateDoc(doc(db,'segments',seg.id), {
        votesOpen: increment(1),
        votersOpen: [...voted, id],
        updatedAt: serverTimestamp()
      })
    )
    await ensureConsensus(seg,'open')
  }

  const onVoteClose = async (seg)=> {
    if (!allowAction('vote', 5000)) return
    const id = getDeviceId()
    const voted = seg.votersClose || []
    if (voted.includes(id)) return
    await withRetry(() =>
      updateDoc(doc(db,'segments',seg.id), {
        votesClose: increment(1),
        votersClose: [...voted, id],
        updatedAt: serverTimestamp()
      })
    )
    await ensureConsensus(seg, 'close')
  }

  return (
    <div className="app">
      <AnnouncementsBar />

      <div className="topbar">
        <div className="title">PozaRica Mapa</div>
        <div className="search">
          <input
            placeholder="Buscar colonia o calle…"
            value={query}
            onChange={e=> setQuery(e.target.value)}
            onKeyDown={(e)=> { if(e.key==='Enter') goToPlace() }}
          />
        </div>
      </div>

      <div className="chipbar">
        {['all','open','closed','clean','aid'].map(t=> (
          <button key={t} className={'chip '+(type===t?'active':'')} onClick={()=> { setType(t); setView('map') }}>
            {label(t)}
          </button>
        ))}
        <button
          className={'chip '+(view==='ann'?'active':'')}
          onClick={()=> setView('ann')}
        >
          Avisos
        </button>
      </div>

      {view === 'ann' ? (
        <AnnouncementsList onClose={()=> setView('map')} search={query} />
      ) : (
        <MapView items={list} center={center} onTap={openFormAt} onLocate={locate}>
          <SegmentsLayer
            items={segments}
            onVoteClean={onVoteClean}
            onVoteOpen={onVoteOpen}
            onVoteClose={onVoteClose}
          />
          <SegmentDrawer
            active={drawSegment}
            onComplete={async ({start, end, wayId})=> {
              const ok = window.confirm('¿Confirmas que este tramo de calle está CERRADO?')
              if (!ok) { setDrawSegment(false); return }
              setDrawSegment(false);
              await withRetry(() =>
                addDoc(colSegments, {
                  startLat:start[0], startLng:start[1],
                  endLat:end[0],   endLng:end[1],
                  wayId: wayId || null,
                  status:'closed',
                  votesOpen:0, votesClean:0, votesClose:0,
                  votersOpen:[], votersClean:[], votersClose:[],
                  createdAt: serverTimestamp(), updatedAt: serverTimestamp()
                })
              )
            }}
          />
        </MapView>
      )}

      {view === 'map' && (
        <>
          <button className="menuToggle" onClick={()=> setMenuOpen(!menuOpen)}>
            {menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          </button>

          <button className="gps" onClick={()=> setDrawSegment(s=> !s)}>
            {drawSegment ? 'Cancelar tramo' : 'Cerrar tramo'}
          </button>

          <button
            className="fab"
            onClick={()=> openFormAt(center ? { lat:center[0], lng:center[1] } : { lat:20.5345, lng:-97.4595 })}
          >
            Reportar
          </button>

          <BottomSheet items={list} />

          {showForm && (
            <ReportForm
              coords={tapCoords}
              onSetCoords={(c)=> setTapCoords(c)}
              onCancel={()=> setShowForm(false)}
              onSubmit={onSubmit}
            />
          )}
        </>
      )}
    </div>
  )
}

function label(t){
  return ({
    all: 'Todo',
    open: 'Transitables',
    closed: 'Cerradas',
    clean: 'Limpieza',
    aid: 'Ayuda'
  }[t])
}
