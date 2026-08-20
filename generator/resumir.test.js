import { describe, it, expect, vi } from 'vitest'
import { resumir, resumirNoticia } from './resumir.js'

const config = { baseUrl: 'https://api.exemplo.com/v1', model: 'modelo-x', apiKey: 'chave-1' }
const noticia = {
  titulo: 'Título',
  url: 'https://a.com/1',
  publicada_em: null,
  conteudo: 'Conteúdo da notícia.',
  fonte: 'A'
}

const respostaLlm = (texto) =>
  new Response(JSON.stringify({ choices: [{ message: { content: texto } }] }), { status: 200 })

describe('resumirNoticia', () => {
  it('chama o endpoint chat/completions e devolve o resumo', async () => {
    const fetchFn = vi.fn(async () => respostaLlm('Resumo gerado.'))
    const resumo = await resumirNoticia(noticia, config, fetchFn)
    expect(resumo).toBe('Resumo gerado.')
    const [url, init] = fetchFn.mock.calls[0]
    expect(url).toBe('https://api.exemplo.com/v1/chat/completions')
    expect(init.headers.Authorization).toBe('Bearer chave-1')
    const corpo = JSON.parse(init.body)
    expect(corpo.model).toBe('modelo-x')
    expect(corpo.messages[0].role).toBe('system')
    expect(corpo.messages[1].content).toContain('Título')
  })

  it('tenta 2 vezes e usa fallback após falhar', async () => {
    const fetchFn = vi.fn(async () => new Response('erro', { status: 500 }))
    const resumo = await resumirNoticia(noticia, config, fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(resumo).toBe('Conteúdo da notícia.')
  })

  it('lança erro explícito em 401 sem retry', async () => {
    const fetchFn = vi.fn(async () => new Response('unauthorized', { status: 401 }))
    await expect(resumirNoticia(noticia, config, fetchFn)).rejects.toThrow(/LLM_API_KEY/)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })
})

describe('resumir', () => {
  it('resume todas as notícias sequencialmente e monta NoticiaFinal', async () => {
    const fetchFn = vi.fn(async () => respostaLlm('Resumo.'))
    const noticias = [noticia, { ...noticia, titulo: 'Dois', url: 'https://a.com/2' }]
    const resultado = await resumir(noticias, config, fetchFn)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(resultado[0]).toEqual({
      titulo: 'Título',
      fonte: 'A',
      url: 'https://a.com/1',
      publicada_em: null,
      resumo: 'Resumo.'
    })
  })
})
