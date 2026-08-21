import { useState, useEffect, createContext, useContext } from 'react'
import { Link, Route, Routes, useSearchParams } from 'react-router-dom'
import { RestaurarRota } from './components/RestaurarRota.jsx'
import { PaginaEdicaoAtual } from './pages/PaginaEdicaoAtual.jsx'
import { PaginaEdicao } from './pages/PaginaEdicao.jsx'
import { PaginaArquivo } from './pages/PaginaArquivo.jsx'
import { carregarFontes } from './fontes.js'

const FonteFiltroContext = createContext({ fonteSelecionada: null, setFonteSelecionada: () => {} })

export function useFonteFiltro() {
  return useContext(FonteFiltroContext)
}

export default function App() {
  const [fontes, setFontes] = useState([])
  const [searchParams, setSearchParams] = useSearchParams()
  const fonteSelecionada = searchParams.get('fonte')

  useEffect(() => {
    carregarFontes().then(setFontes)
  }, [])

  const definirFonte = (fonteId) => {
    const params = new URLSearchParams(searchParams)
    if (fonteId) {
      params.set('fonte', fonteId)
    } else {
      params.delete('fonte')
    }
    setSearchParams(params)
  }

  const nomesFontes = fontes.map((f) => ({ id: f.id, nome: f.nome }))

  return (
    <FonteFiltroContext.Provider value={{ fonteSelecionada, setFonteSelecionada: definirFonte }}>
      <div className="container">
        <header className="site">
          <h1>
            <Link to="/">Diário da Capital</Link>
          </h1>
          <nav aria-label="Navegação principal">
            <Link to="/">Início</Link>
            <Link to="/arquivo">Arquivo</Link>
            {nomesFontes.length > 0 && (
              <div className="fontes-filtro" role="group" aria-label="Filtrar por fonte">
                <button
                  className={`fonte-btn ${!fonteSelecionada ? 'ativa' : ''}`}
                  onClick={() => definirFonte(null)}
                  aria-pressed={!fonteSelecionada}
                >
                  Todas
                </button>
                {nomesFontes.map(({ id, nome }) => (
                  <button
                    key={id}
                    className={`fonte-btn ${fonteSelecionada === id ? 'ativa' : ''}`}
                    onClick={() => definirFonte(id)}
                    aria-pressed={fonteSelecionada === id}
                  >
                    {nome}
                  </button>
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
    </FonteFiltroContext.Provider>
  )
}
