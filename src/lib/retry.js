export async function withRetry(fn, { retries=3, baseDelay=300 } = {}){
  let lastErr
  for (let i=0; i<=retries; i++){
    try { return await fn() } catch (e){
      lastErr = e
      const ms = baseDelay * Math.pow(2, i) + Math.random()*120
      await new Promise(r=> setTimeout(r, ms))
    }
  }
  throw lastErr
}
