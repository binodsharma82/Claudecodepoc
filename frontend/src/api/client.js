const BASE = '/api'

async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${BASE}${path}${qs ? '?' + qs : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json()
}

export const api = {
  territories:      ()    => get('/territories'),
  kpis:             (p)   => get('/kpis', p),
  trend:            (p)   => get('/trend', p),
  territoryPerf:    (p)   => get('/territory-perf', p),
  productShare:     (p)   => get('/product-share', p),
  payerMix:         (p)   => get('/payer-mix', p),
  hcpTracker:       (p)   => get('/hcp-tracker', p),
  hcp:              (cid) => get(`/hcp/${cid}`),
  decile:           (p)   => get('/decile', p),
  alerts:           (p)   => get('/alerts', p),
  speakers:         (p)   => get('/speakers', p),
  vaccines:         (p)   => get('/vaccines', p),
  hcpConcentration: (p)   => get('/hcp-concentration', p),
}
