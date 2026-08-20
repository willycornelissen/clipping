import { useMemo } from 'react'
import { Noticia } from './Noticia.jsx'
import { formatarData } from '../formatar.js'

export function EdicaoView({ edicao }) {
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const n of edicao.noticias) {
      if (!mapa.has(n.fonte)) mapa.set(n.fonte, [])
      mapa.get(n.fonte).push(n)
    }
    return [...mapa.entries()]
  }, [edicao])

  return (
    <div>
      <p className="data-edicao">Edição de {formatarData(edicao.id)}</p>
      {grupos.map(([fonte, noticias]) => (
        <section key={fonte}>
          <h2 className="fonte">{fonte}</h2>
          {noticias.map((n, i) => (
            <Noticia key={`${n.url}-${i}`} noticia={n} />
          ))}
        </section>
      ))}
    </div>
  )
}
