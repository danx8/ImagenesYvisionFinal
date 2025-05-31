import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Landing from './Landing';
import UnoSolo from './UnoSolo';
import Home from './Home';
import Arduino from './Arduino';
import Vista1Persona from './Vista1Persona';
function App() {
  return (
    <Router>
      {/* Navbar Bootstrap fija arriba */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow">
        <div className="container-fluid">
          <span className="navbar-brand d-flex align-items-center gap-2">
            <span style={{fontSize: '2rem'}}>🛩</span>
            <span className="fw-bold">FAC</span>
          </span>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto gap-2">
              <li className="nav-item">
                <Link to="/" className="nav-link">Inicio</Link>
              </li>
              <li className="nav-item">
                <Link to="/subir-video" className="nav-link">Subir Video</Link>
              </li>
              <li className="nav-item">
                <Link to="/unoSolo" className="nav-link">Uno Solo</Link>
              </li>
              <li className="nav-item">
                <Link to="/arduino" className="nav-link">Arduino</Link>
              </li>
              <li className="nav-item">
                <Link to="/vista1persona" className="nav-link">Vista 1 Persona</Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Contenido principal con margen superior para la navbar fija */}
      <main className="pt-5" style={{marginTop: '80px'}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/subir-video" element={<Landing />} />
          <Route path="/unoSolo" element={<UnoSolo />} />
          <Route path="/arduino" element={<Arduino />} />
          <Route path="/vista1persona" element={<Vista1Persona />} />


          
        </Routes>
      </main>
    </Router>
  );
}

export default App;
