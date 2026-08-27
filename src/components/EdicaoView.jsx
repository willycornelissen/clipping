import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Noticia } from './Noticia.jsx'
import { ASSUNTOS, obterAssuntoDaNoticia } from '../fontes.js'
import { useEdicaoContext } from '../EdicaoContext.js'

export function EdicaoView({ edicao, fontes = [] }) {
  const [searchParams] = useSearchParams()
  const assuntoSelecionado = searchParams.get('assunto')
  const { setDataEdicao } = useEdicaoContext()

  useEffect(() => {
    setDataEdicao(edicao.id)
    return () => setDataEdicao(null)
  }, [edicao.id, setDataEdicao])

  const grupos = useMemo(() => {
    const assuntoObj = ASSUNTOS.find((a) => a.id === assuntoSelecionado)
    if (assuntoObj) {
      const noticias = edicao.noticias.filter((n) => obterAssuntoDaNoticia(n, fontes)?.id === assuntoObj.id)
      return [[assuntoObj.nome, noticias]]
    }

    const mapa = new Map(ASSUNTOS.map((a) => [a.id, []]))
    const semAssunto = []
    for (const n of edicao.noticias) {
      const assunto = obterAssuntoDaNoticia(n, fontes)
      if (assunto) mapa.get(assunto.id).push(n)
      else semAssunto.push(n)
    }
    const resultado = []
    for (const [id, noticias] of mapa) {
      if (noticias.length > 0) resultado.push([ASSUNTOS.find((a) => a.id === id).nome, noticias])
    }
    if (semAssunto.length > 0) resultado.push(['Geral', semAssunto])
    return resultado
  }, [edicao, fontes, assuntoSelecionado])

  const semNoticias = grupos.length === 0 || grupos.every(([, noticias]) => noticias.length === 0)

  return (
    <div>
      {semNoticias ? (
        <p className="sem-noticias">Nenhuma notícia para este assunto.</p>
      ) : (
        <div className="grade-noticias">
          {grupos.map(([assunto, noticias]) => (
            <section key={assunto} className="categoria-section">
              <h2 className="assunto">{assunto}</h2>
              <div className="noticias-grid">
                {noticias.map((n, i) => (
                  <Noticia key={`${n.url}-${i}`} noticia={n} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
