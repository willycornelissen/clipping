import { useMemo } from 'react'
import { Noticia } from './Noticia.jsx'
import { formatarData } from '../formatar.js'
import { extrairCategoria, obterCategoriaDaNoticia } from '../fontes.js'
import { useFonteFiltro } from '../App.jsx'

export function EdicaoView({ edicao, fontes = [] }) {
  const { fonteSelecionada } = useFonteFiltro()

  const grupos = useMemo(() => {
    let noticiasFiltradas = edicao.noticias
    if (fonteSelecionada) {
      const fonteObj = fontes.find((f) => f.id === fonteSelecionada)
      if (fonteObj) {
        noticiasFiltradas = edicao.noticias.filter((n) => n.fonte === fonteObj.nome)
      }
    }

    const mapa = new Map()
    for (const n of noticiasFiltradas) {
      const categoria = obterCategoriaDaNoticia(n, fontes)
      if (!mapa.has(categoria)) mapa.set(categoria, [])
      mapa.get(categoria).push(n)
    }
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [edicao, fontes, fonteSelecionada])

  const fonteObj = fontes.find((f) => f.id === fonteSelecionada)
  const tituloFonte = fonteObj ? fonteObj.nome : 'Todas as fontes'

  return (
    <div>
      <p className="data-edicao">Edição de {formatarData(edicao.id)}</p>
      <p className="fonte-filtro-ativa">Exibindo: <strong>{tituloFonte}</strong></p>
      {grupos.length === 0 ? (
        <p className="sem-noticias">Nenhuma notícia para esta fonte.</p>
      ) : (
        <div className="grade-noticias">
          {grupos.map(([categoria, noticias]) => (
            <section key={categoria} className="categoria-section">
              <h2 className="fonte">{categoria}</h2>
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
