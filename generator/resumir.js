const PROMPT_SISTEMA =
  'Você é um editor de notícias. Resuma a notícia a seguir em 2 a 3 frases, em português, com tom jornalístico neutro. Responda apenas com o resumo, sem títulos, preâmbulos ou comentários.'

export async function resumirNoticia(noticia, config, fetchFn = fetch) {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
  const corpo = {
    model: config.model,
    messages: [
      { role: 'system', content: PROMPT_SISTEMA },
      { role: 'user', content: `Título: ${noticia.titulo}\n\n${noticia.conteudo}` }
    ]
  }
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const resp = await fetchFn(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
      body: JSON.stringify(corpo),
      signal: AbortSignal.timeout(60000)
    })
    if (resp.status === 401) {
      throw new Error('Autenticação da LLM falhou (401). Verifique o secret LLM_API_KEY.')
    }
    if (resp.ok) {
      const dados = await resp.json()
      const resumo = dados.choices?.[0]?.message?.content?.trim()
      if (resumo) return resumo
    }
  }
  return noticia.conteudo || noticia.titulo
}

export async function resumir(noticias, config, fetchFn = fetch) {
  const resultado = []
  for (const n of noticias) {
    const resumo = await resumirNoticia(n, config, fetchFn)
    resultado.push({ titulo: n.titulo, fonte: n.fonte, url: n.url, publicada_em: n.publicada_em, resumo })
  }
  return resultado
}
