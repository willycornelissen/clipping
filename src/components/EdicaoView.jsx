import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Noticia } from './Noticia.jsx'
import { formatarData } from '../formatar.js'
import { ASSUNTOS, obterAssuntoDaNoticia } from '../fontes.js'

export function EdicaoView({ edicao, fontes = [] }) {
  const [searchParams] = useSearchParams()
  const assuntoSelecionado = searchParams.get('assunto')

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

  const assuntoObj = ASSUNTOS.find((a) => a.id === assuntoSelecionado)
  const tituloExibicao = assuntoObj ? assuntoObj.nome : 'Todas as notícias'
  const semNoticias = grupos.length === 0 || grupos.every(([, noticias]) => noticias.length === 0)

  return (
    <div>
      <p className="data-edicao">Edição de {formatarData(edicao.id)}</p>
      <p className="assunto-filtro-ativa">Exibindo: <strong>{tituloExibicao}</strong></p>
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
