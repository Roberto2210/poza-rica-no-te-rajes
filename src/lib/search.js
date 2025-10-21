export async function localSearch(query){
  try {
    const resp = await fetch('/places.json', { cache: 'force-cache' })
    if (!resp.ok) return null
    const items = await resp.json()
    const q = (query||'').toLowerCase()
    const best = items.find(p =>
      p.title.toLowerCase().includes(q) ||
      (p.aliases||[]).some(a => a.toLowerCase().includes(q))
    )
    return best ? [{ lat: best.lat, lon: best.lng, display_name: best.title }] : []
  } catch(e){
    return null
  }
}
export async function nominatimSearchOnline(q){
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
  if (!resp.ok) return []
  return await resp.json()
}
