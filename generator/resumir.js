const PROMPT_SISTEMA =
  'Você é um editor de notícias. Resuma a notícia a seguir em no máximo dois parágrafos, em português, com tom jornalístico neutro. Responda apenas com o resumo, sem títulos, preâmbulos ou comentários.'

export class ErroAutenticacaoLlm extends Error {}

const MAX_CONTEUDO_LLM = 3000
const MAX_FALLBACK = 500

function truncar(texto, max) {
  if (texto.length <= max) return texto
  return texto.slice(0, max).trim() + '…'
}

export async function resumirNoticia(noticia, config, fetchFn = fetch) {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`
  const conteudoTruncado = truncar(noticia.conteudo, MAX_CONTEUDO_LLM)
  const corpo = {
    model: config.model,
    messages: [
      { role: 'system', content: PROMPT_SISTEMA },
      { role: 'user', content: `Título: ${noticia.titulo}\n\n${conteudoTruncado}` }
    ]
  }
  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    try {
      const resp = await fetchFn(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify(corpo),
        signal: AbortSignal.timeout(60000)
      })
      if (resp.status === 401) {
        throw new ErroAutenticacaoLlm('Autenticação da LLM falhou (401). Verifique o secret LLM_API_KEY.')
      }
      if (resp.ok) {
        const dados = await resp.json()
        const resumo = dados.choices?.[0]?.message?.content?.trim()
        if (resumo) return resumo
      }
    } catch (erro) {
      if (erro instanceof ErroAutenticacaoLlm) throw erro
    }
  }
  return truncar(noticia.conteudo || noticia.titulo, MAX_FALLBACK)
}

export async function resumir(noticias, config, fetchFn = fetch) {
  const resultado = []
  for (const n of noticias) {
    const resumo = await resumirNoticia(n, config, fetchFn)
    resultado.push({ titulo: n.titulo, fonte: n.fonte, url: n.url, publicada_em: n.publicada_em, resumo })
  }
  return resultado
}
