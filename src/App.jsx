import { Link, Route, Routes } from 'react-router-dom'
import { RestaurarRota } from './components/RestaurarRota.jsx'
import { PaginaEdicaoAtual } from './pages/PaginaEdicaoAtual.jsx'
import { PaginaEdicao } from './pages/PaginaEdicao.jsx'
import { PaginaArquivo } from './pages/PaginaArquivo.jsx'

export default function App() {
  return (
    <div className="container">
      <header className="site">
        <h1>
          <Link to="/">Diário da Capital</Link>
        </h1>
        <nav aria-label="Navegação principal">
          <Link to="/">Início</Link>
          <Link to="/arquivo">Arquivo</Link>
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
