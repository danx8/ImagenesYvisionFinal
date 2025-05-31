import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Vista1Persona() {
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const imagenesPorPagina = 40; // Ahora 40 imágenes por página

  useEffect(() => {
    cargarCarpetas();
  }, []);

  const cargarCarpetas = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/listar-carpetas-imagenes');
      setCarpetas(response.data.carpetas);
    } catch (error) {
      setMensaje('Error al cargar las carpetas');
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    if (carpetaSeleccionada) {
      cargarImagenes();
    }
  }, [carpetaSeleccionada]);

  const cargarImagenes = async () => {
    try {
      setMensaje('Cargando imágenes...');
      const response = await axios.get(`http://localhost:5000/api/listar-imagenes/${carpetaSeleccionada}`);
      setImagenes(response.data.imagenes);
      setTotalPaginas(Math.ceil(response.data.imagenes.length / imagenesPorPagina));
      setPaginaActual(1);
      setMensaje('');
    } catch (error) {
      setMensaje('Error al cargar las imágenes');
      console.error('Error:', error);
    }
  };

  const handleSeleccionar = (e) => {
    setCarpetaSeleccionada(e.target.value);
    setImagenes([]);
    setPaginaActual(1);
  };

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calcular las imágenes para la página actual
  const imagenesPaginadas = imagenes.slice(
    (paginaActual - 1) * imagenesPorPagina,
    paginaActual * imagenesPorPagina
  );

  // Paginador compacto
  const getPaginas = () => {
    const paginas = [];
    const maxPaginas = 7; // máximo de botones a mostrar
    let start = Math.max(1, paginaActual - 3);
    let end = Math.min(totalPaginas, paginaActual + 3);
    if (paginaActual <= 4) {
      start = 1;
      end = Math.min(totalPaginas, maxPaginas);
    } else if (paginaActual > totalPaginas - 4) {
      end = totalPaginas;
      start = Math.max(1, totalPaginas - maxPaginas + 1);
    }
    for (let i = start; i <= end; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  return (
    <div className="contenedor-flexible">
      <div className="upload-section">
        <h1>📸 Vista de Imágenes</h1>
        
        <div className="upload-form">
          <div className="form-group">
            <select 
              value={carpetaSeleccionada} 
              onChange={handleSeleccionar}
              className="form-select"
            >
              <option value="">Selecciona una carpeta de imágenes</option>
              {carpetas.map((carpeta, idx) => (
                <option key={idx} value={carpeta}>{carpeta}</option>
              ))}
            </select>
          </div>
        </div>

        {mensaje && <div className="mensaje-estado">{mensaje}</div>}

        {imagenes.length > 0 && (
          <div className="galeria-container" style={{maxHeight: '70vh', overflowY: 'auto'}}>
            <div className="galeria-grid">
              {imagenesPaginadas.map((imagen, idx) => (
                <div key={idx} className="imagen-item">
                  <img
                    src={`data:image/jpeg;base64,${imagen}`}
                    alt={`Imagen ${idx + 1}`}
                    className="imagen-galeria"
                  />
                </div>
              ))}
            </div>

            {/* Paginación compacta */}
            {totalPaginas > 1 && (
              <div className="paginacion">
                <button
                  className="btn btn-outline"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  Anterior
                </button>
                {getPaginas().map((num) => (
                  <button
                    key={num}
                    className={`btn btn-pagina ${paginaActual === num ? 'activa' : ''}`}
                    onClick={() => cambiarPagina(num)}
                  >
                    {num}
                  </button>
                ))}
                {getPaginas()[getPaginas().length - 1] < totalPaginas && (
                  <>
                    <span style={{margin: '0 8px'}}>...</span>
                    <button
                      className="btn btn-pagina"
                      onClick={() => cambiarPagina(totalPaginas)}
                    >
                      {totalPaginas}
                    </button>
                  </>
                )}
                <button
                  className="btn btn-outline"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Vista1Persona;
