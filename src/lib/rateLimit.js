export function allowAction(key, windowMs){
  const k = `rl_${key}`
  const now = Date.now()
  const last = Number(localStorage.getItem(k) || 0)
  if (now - last < windowMs) return false
  localStorage.setItem(k, String(now))
  return true
}
