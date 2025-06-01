import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Vista1Persona from './Vista1persona';

function Vista1PersonaPage() {
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState('');
  const [mensaje, setMensaje] = useState('');

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

  const handleSeleccionar = (e) => {
    setCarpetaSeleccionada(e.target.value);
  };

  return (
    <div style={{width: '100%'}}>
      
        
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
      
      {/* Galería de imágenes */}
      <Vista1Persona carpetaSeleccionada={carpetaSeleccionada} />
    </div>
  );
}

export default Vista1PersonaPage; 