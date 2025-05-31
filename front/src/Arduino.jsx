// Arduino.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Arduino() {
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState('');
  const [imagenActual, setImagenActual] = useState(null);
  const [clasesDetectadas, setClasesDetectadas] = useState([]);
  const [mensaje, setMensaje] = useState('');
  const [eventSource, setEventSource] = useState(null);

  // Cargar carpetas al montar
  useEffect(() => {
    async function fetchCarpetas() {
      try {
        const res = await axios.get('http://localhost:5000/api/listar-carpetas-imagenes');
        setCarpetas(res.data.carpetas);
      } catch {
        setMensaje('Error al cargar carpetas');
      }
    }
    fetchCarpetas();
  }, []);

  // Limpiar EventSource al desmontar
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const handleReconocer = async () => {
    if (!carpetaSeleccionada) {
      setMensaje('Selecciona una carpeta primero');
      return;
    }

    // Cerrar EventSource anterior si existe
    if (eventSource) {
      eventSource.close();
    }

    setMensaje('Procesando...');
    setImagenActual(null);
    setClasesDetectadas([]);

    try {
      const source = new EventSource(`http://localhost:5000/api/reconocer-carpeta?nombre_carpeta=${encodeURIComponent(carpetaSeleccionada)}`);

      source.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.error) {
          setMensaje(data.error);
          source.close();
          return;
        }

        setImagenActual(data.imagen);
        setClasesDetectadas(data.clases);
        setMensaje(`Procesando: ${data.nombre_archivo}`);
      };

      source.onerror = () => {
        console.error('Error en EventSource');
        setMensaje('Error en la conexión');
        source.close();
      };

      setEventSource(source);
    } catch (error) {
      setMensaje('Error al iniciar el procesamiento');
    }
  };

  const handleSeleccionar = (e) => {
    setCarpetaSeleccionada(e.target.value);
    setImagenActual(null);
    setClasesDetectadas([]);
    setMensaje('');
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  return (
    <div className="contenedor-flexible">
      <div className="upload-section">
        <h1>🎮 Reconocimiento con Arduino</h1>
        
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
            <button 
              onClick={handleReconocer} 
              className="btn btn-primary"
              style={{ marginLeft: '1rem' }}
            >
              Reconocer
            </button>
          </div>
        </div>

        {mensaje && <div className="mensaje-estado">{mensaje}</div>}

        {imagenActual && (
          <div className="resultado-container">
            <div className="imagen-container">
              <img
                src={`data:image/jpeg;base64,${imagenActual}`}
                alt="frame-actual"
                className="imagen-procesada"
              />
            </div>
            
            {clasesDetectadas.length > 0 && (
              <div className="clases-container">
                <h3>Clases detectadas:</h3>
                <div className="clases-lista">
                  {clasesDetectadas.map((clase, idx) => (
                    <span key={idx} className="clase-badge">
                      {clase}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Arduino;
