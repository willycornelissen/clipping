import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { carregarIndice } from '../api.js'
import { formatarData } from '../formatar.js'

const POR_PAGINA = 20

export function PaginaArquivo() {
  const [searchParams] = useSearchParams()
  const [indice, setIndice] = useState(undefined)

  useEffect(() => {
    carregarIndice().then(setIndice)
  }, [])

  const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1)
  if (indice === undefined) return <p>Carregando…</p>

  const edicoes = indice?.edicoes ?? []
  if (edicoes.length === 0) return <p>Ainda não há edições publicadas.</p>

  const totalPaginas = Math.ceil(edicoes.length / POR_PAGINA)
  const fatia = edicoes.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)

  return (
    <div>
      <h2 className="fonte">Arquivo de edições</h2>
      <ul className="lista-edicoes">
        {fatia.map((e) => (
          <li key={e.id}>
            <Link to={`/edicao/${e.id}`}>Edição de {formatarData(e.id)}</Link>
            <span className="meta"> — {e.noticias} notícias</span>
          </li>
        ))}
      </ul>
      {totalPaginas > 1 && (
        <nav className="paginacao">
          {pagina > 1 && <Link to={`/arquivo?pagina=${pagina - 1}`}>← Anterior</Link>}
          {pagina < totalPaginas && <Link to={`/arquivo?pagina=${pagina + 1}`}>Próxima →</Link>}
        </nav>
      )}
    </div>
  )
}
