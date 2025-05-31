// Arduino.jsx
import React, { useState } from 'react';
import axios from 'axios';

function Arduino() {
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState('');
  const [imagenes, setImagenes] = useState([]);
  const [indice, setIndice] = useState(0);
  const [reproduciendo, setReproduciendo] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [timerId, setTimerId] = useState(null);

  // Cargar carpetas al montar
  React.useEffect(() => {
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

  // Reproducir imágenes como video
  React.useEffect(() => {
    if (reproduciendo && imagenes.length > 0 && indice < imagenes.length - 1) {
      const id = setTimeout(() => setIndice(i => i + 1), 200);
      setTimerId(id);
    } else {
      if (timerId) clearTimeout(timerId);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
    // eslint-disable-next-line
  }, [reproduciendo, indice, imagenes]);

  const handleReconocer = async () => {
    if (!carpetaSeleccionada) {
      setMensaje('Selecciona una carpeta primero');
      return;
    }
    setMensaje('Procesando...');
    setImagenes([]);
    setIndice(0);
    setReproduciendo(false);
    try {
      const res = await axios.post('http://localhost:5000/api/reconocer-carpeta', {
        nombre_carpeta: carpetaSeleccionada
      });
      setImagenes(res.data.imagenes);
      setMensaje('Reconocimiento listo.');
      setIndice(0);
      setReproduciendo(true);
    } catch {
      setMensaje('Error al procesar la carpeta');
    }
  };

  const handleSeleccionar = (e) => {
    setCarpetaSeleccionada(e.target.value);
    setImagenes([]);
    setIndice(0);
    setReproduciendo(false);
    setMensaje('');
  };

  const handlePlay = () => {
    if (imagenes.length > 0) {
      setReproduciendo(true);
    }
  };

  const handlePause = () => {
    setReproduciendo(false);
    if (timerId) clearTimeout(timerId);
  };

  return (
    <div className="contenedor-flexible">
      <h1>Reconocimiento con Arduino</h1>
      <div style={{ marginBottom: '1rem' }}>
        <select value={carpetaSeleccionada} onChange={handleSeleccionar}>
          <option value="">Selecciona una carpeta de imágenes</option>
          {carpetas.map((carpeta, idx) => (
            <option key={idx} value={carpeta}>{carpeta}</option>
          ))}
        </select>
        <button onClick={handleReconocer} style={{ marginLeft: '1rem' }}>Reconocer</button>
      </div>
      {mensaje && <div className="mensaje-estado">{mensaje}</div>}
      {imagenes.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <img
            src={`data:image/jpeg;base64,${imagenes[indice]}`}
            alt={`frame-${indice}`}
            style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 12px #00000040' }}
          />
          <div style={{ marginTop: '1rem' }}>
            <button onClick={handlePlay} disabled={reproduciendo}>Play</button>
            <button onClick={handlePause} disabled={!reproduciendo} style={{ marginLeft: '1rem' }}>Pause</button>
            <span style={{ marginLeft: '2rem' }}>Frame {indice + 1} / {imagenes.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Arduino;
