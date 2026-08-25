import { Link, Route, Routes, useSearchParams } from 'react-router-dom'
import { RestaurarRota } from './components/RestaurarRota.jsx'
import { PaginaEdicaoAtual } from './pages/PaginaEdicaoAtual.jsx'
import { PaginaEdicao } from './pages/PaginaEdicao.jsx'
import { PaginaArquivo } from './pages/PaginaArquivo.jsx'
import { PaginaSobre } from './pages/PaginaSobre.jsx'
import { ASSUNTOS } from './fontes.js'

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams()
  const assuntoSelecionado = searchParams.get('assunto')

  const definirAssunto = (assuntoId) => {
    const params = new URLSearchParams(searchParams)
    if (assuntoId) {
      params.set('assunto', assuntoId)
    } else {
      params.delete('assunto')
    }
    setSearchParams(params)
  }

  return (
    <div className="container">
      <header className="site">
        <h1>
          <Link to="/">Diário da Capital</Link>
        </h1>
        <nav aria-label="Navegação principal">
          <Link to="/">Início</Link>
          <Link to="/sobre">Sobre</Link>
          <Link to="/arquivo">Arquivo</Link>
          <div className="assuntos-filtro" role="group" aria-label="Filtrar por assunto">
            <button
              className={`assunto-btn ${!assuntoSelecionado ? 'ativa' : ''}`}
              onClick={() => definirAssunto(null)}
              aria-pressed={!assuntoSelecionado}
            >
              Todas
            </button>
            {ASSUNTOS.map(({ id, nome }) => (
              <button
                key={id}
                className={`assunto-btn ${assuntoSelecionado === id ? 'ativa' : ''}`}
                onClick={() => definirAssunto(id)}
                aria-pressed={assuntoSelecionado === id}
              >
                {nome}
              </button>
            ))}
          </div>
        </nav>
      </header>
      <RestaurarRota />
      <Routes>
        <Route path="/" element={<PaginaEdicaoAtual />} />
        <Route path="/sobre" element={<PaginaSobre />} />
        <Route path="/arquivo" element={<PaginaArquivo />} />
        <Route path="/edicao/:id" element={<PaginaEdicao />} />
      </Routes>
    </div>
  )
}
