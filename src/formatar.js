export function formatarDataHora(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.toLocaleDateString('pt-BR', { dateStyle: 'short' })} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

export function formatarData(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso ?? '')) return iso ?? ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function caminhoRelativo(alvo, base) {
  const i = alvo.indexOf(base)
  const resto = i >= 0 ? alvo.slice(i + base.length) : alvo
  return resto.startsWith('/') ? resto : `/${resto}`
}
