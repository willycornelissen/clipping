import { useState, useEffect } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import { RestaurarRota } from './components/RestaurarRota.jsx'
import { PaginaEdicaoAtual } from './pages/PaginaEdicaoAtual.jsx'
import { PaginaEdicao } from './pages/PaginaEdicao.jsx'
import { PaginaArquivo } from './pages/PaginaArquivo.jsx'
import { carregarFontes, agruparPorFonteECategoria } from './fontes.js'

export default function App() {
  const [fontes, setFontes] = useState([])
  const [fontesAgrupadas, setFontesAgrupadas] = useState({})
  const [menuAberto, setMenuAberto] = useState(null)

  useEffect(() => {
    carregarFontes().then((f) => {
      setFontes(f)
      setFontesAgrupadas(agruparPorFonteECategoria(f))
    })
  }, [])

  return (
    <div className="container">
      <header className="site">
        <h1>
          <Link to="/">Diário da Capital</Link>
        </h1>
        <nav aria-label="Navegação principal">
          <Link to="/">Início</Link>
          <Link to="/arquivo">Arquivo</Link>
          {Object.keys(fontesAgrupadas).length > 0 && (
            <div className="fontes-menu">
              {Object.entries(fontesAgrupadas).map(([fonte, categorias]) => (
                <div key={fonte} className="fonte-item">
                  <button
                    className={`fonte-toggle ${menuAberto === fonte ? 'aberto' : ''}`}
                    onClick={() => setMenuAberto(menuAberto === fonte ? null : fonte)}
                    aria-expanded={menuAberto === fonte}
                    aria-haspopup="true"
                  >
                    {fonte}
                    <span className="seta" aria-hidden="true">▾</span>
                  </button>
                  {menuAberto === fonte && (
                    <ul className="categorias-dropdown" role="menu">
                      {categorias.map((cat) => (
                        <li key={cat} role="none">
                          <Link to="/" role="menuitem" className="categoria-link">
                            {cat}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </nav>
      </header>
      <RestaurarRota />
      <Routes>
        <Route path="/" element={<PaginaEdicaoAtual />} />
        <Route path="/arquivo" element={<PaginaArquivo />} />
        <Route path="/edicao/:id" element={<PaginaEdicao />} />
      </Routes>
    </div>
  )
}
