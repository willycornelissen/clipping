export function dataHoje(agora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora)
}

export function montarEdicao(noticias, { id, geradaEm }) {
  return { id, gerada_em: geradaEm, noticias }
}

export function atualizarIndice(indice, edicao) {
  const demais = indice.edicoes.filter((e) => e.id !== edicao.id)
  const entrada = {
    id: edicao.id,
    data: edicao.id,
    fontes: new Set(edicao.noticias.map((n) => n.fonte)).size,
    noticias: edicao.noticias.length
  }
  return { edicoes: [entrada, ...demais].sort((a, b) => b.id.localeCompare(a.id)) }
}
