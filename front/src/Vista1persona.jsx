import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ImageModal.css';

const CLASSES = [
  { color: 'color1', label: 'Clase 1' },
  { color: 'color2', label: 'Clase 2' },
  { color: 'color3', label: 'Clase 3' },
  { color: 'color4', label: 'Clase 4' },
];

function Vista1Persona({ carpetaSeleccionada }) {
  const [imagenes, setImagenes] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [mensaje, setMensaje] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [activeClass, setActiveClass] = useState('color1');
  const [boxes, setBoxes] = useState([]); // {x1, y1, x2, y2, clase}
  const [drawing, setDrawing] = useState(false);
  const [currentBox, setCurrentBox] = useState(null);
  const imgRef = useRef();
  const imagenesPorPagina = 40;
  const [modalIndex, setModalIndex] = useState(0); // índice de la imagen en el modal
  const [showSentOverlay, setShowSentOverlay] = useState(false);
  const [undoStack, setUndoStack] = useState([]); // Para rehacer

  useEffect(() => {
    if (carpetaSeleccionada) {
      cargarImagenes();
    } else {
      setImagenes([]);
      setTotalPaginas(1);
      setPaginaActual(1);
      setMensaje('');
    }
    // eslint-disable-next-line
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

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModal = (imagen, idxGlobal) => {
    setModalAbierto(true);
    setBoxes([]); // Limpiar anotaciones al abrir nueva imagen
    setModalIndex(idxGlobal); // Usar índice global
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setBoxes([]);
    setCurrentBox(null);
    setDrawing(false);
  };

  // Dibujo de bounding boxes
  const handleMouseDown = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDrawing(true);
    setCurrentBox({ x1: x, y1: y, x2: x, y2: y, clase: activeClass });
  };

  const handleMouseMove = (e) => {
    if (!drawing || !imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCurrentBox((prev) => prev ? { ...prev, x2: x, y2: y } : null);
  };

  const handleMouseUp = () => {
    if (!drawing || !currentBox) return;
    setBoxes((prev) => {
      setUndoStack([]); // Limpiar el redo stack al dibujar uno nuevo
      return [...prev, currentBox];
    });
    setDrawing(false);
    setCurrentBox(null);
  };

  const imagenesPaginadas = imagenes.slice(
    (paginaActual - 1) * imagenesPorPagina,
    paginaActual * imagenesPorPagina
  );

  // Paginador compacto
  const getPaginas = () => {
    const paginas = [];
    const maxPaginas = 7;
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

  // Para mostrar los cuadros sobre la imagen
  const renderBoxes = () => {
    if (!imgRef.current) return null;
    return boxes.concat(currentBox ? [currentBox] : []).map((box, idx) => {
      if (!box) return null;
      const x = Math.min(box.x1, box.x2);
      const y = Math.min(box.y1, box.y2);
      const w = Math.abs(box.x2 - box.x1);
      const h = Math.abs(box.y2 - box.y1);
      return (
        <div
          key={idx}
          className={`image-modal-bbox ${box.clase}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: w,
            height: h,
            border: `2.5px solid`,
            borderColor: getColorFromClass(box.clase),
            pointerEvents: 'none',
            borderRadius: 6,
            boxSizing: 'border-box',
          }}
        />
      );
    });
  };

  function getColorFromClass(clase) {
    switch (clase) {
      case 'color1': return '#ff5252';
      case 'color2': return '#4caf50';
      case 'color3': return '#2196f3';
      case 'color4': return '#ffd600';
      default: return '#888';
    }
  }

  // Navegación en el modal
  const handlePrev = () => {
    if (modalIndex > 0) {
      setBoxes([]);
      setModalIndex(modalIndex - 1);
    }
  };
  const handleNext = () => {
    if (modalIndex < imagenes.length - 1) {
      setBoxes([]);
      setModalIndex(modalIndex + 1);
    }
  };

  // Deshacer y rehacer para los cuadros
  const handleUndo = () => {
    if (boxes.length > 0) {
      setUndoStack((prev) => [boxes[boxes.length - 1], ...prev]);
      setBoxes((prev) => prev.slice(0, -1));
    }
  };
  const handleRedo = () => {
    if (undoStack.length > 0) {
      setBoxes((prev) => [...prev, undoStack[0]]);
      setUndoStack((prev) => prev.slice(1));
    }
  };

  // Descargar imagen y labels
  const handleEnviar = async () => {
    if (imgRef.current) {
      const w = imgRef.current.naturalWidth;
      const h = imgRef.current.naturalHeight;
      const lines = boxes.map(box => {
        // Normalizar coordenadas YOLO
        const x1 = Math.min(box.x1, box.x2);
        const y1 = Math.min(box.y1, box.y2);
        const x2 = Math.max(box.x1, box.x2);
        const y2 = Math.max(box.y1, box.y2);
        const xc = ((x1 + x2) / 2) / w;
        const yc = ((y1 + y2) / 2) / h;
        const bw = Math.abs(x2 - x1) / w;
        const bh = Math.abs(y2 - y1) / h;
        // Clase: color1->0, color2->1, etc
        const claseIdx = CLASSES.findIndex(c => c.color === box.clase);
        return `${claseIdx} ${xc.toFixed(6)} ${yc.toFixed(6)} ${bw.toFixed(6)} ${bh.toFixed(6)}`;
      });
      const contenido_labels = lines.join('\n');

      try {
        const response = await axios.post('http://localhost:5000/api/guardar-labels', {
          nombre_carpeta: carpetaSeleccionada,
          nombre_imagen: imagenes[modalIndex].nombre,
          contenido_labels: contenido_labels
        });
        setMensaje(response.data.mensaje || 'Labels guardados exitosamente');
        setShowSentOverlay(true);
        setTimeout(() => setShowSentOverlay(false), 900);
      } catch (error) {
        setMensaje(error.response?.data?.error || 'Error al guardar labels');
      }
    }
  };

  return (
    <>
      <div className="contenedor-flexible" style={{width: '100%'}}>
        {mensaje && <div className="mensaje-estado">{mensaje}</div>}
        {imagenes.length > 0 && (
          <>
            <div className="galeria-container">
              <div className="galeria-grid">
                {imagenesPaginadas.map((imagen, idx) => {
                  const idxGlobal = (paginaActual - 1) * imagenesPorPagina + idx;
                  return (
                    <div key={idxGlobal} className="imagen-item" onClick={() => abrirModal(imagen, idxGlobal)} style={{cursor: 'pointer'}}>
                      <img
                        src={`data:image/jpeg;base64,${imagen.base64}`}
                        alt={`Imagen ${idxGlobal + 1}`}
                        className="imagen-galeria"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {totalPaginas > 1 && (
              <div className="paginador">
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
          </>
        )}
      </div>
      {/* Modal para imagen grande, usando CSS exclusivo */}
      {modalAbierto && (
        <div className="image-modal-overlay" onClick={cerrarModal}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            {showSentOverlay && (
              <div className="sent-overlay">¡Enviado!</div>
            )}
            <img
              ref={imgRef}
              src={`data:image/jpeg;base64,${imagenes[modalIndex]?.base64}`}
              alt="Imagen grande"
              className="image-modal-img"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              draggable={false}
              style={{ userSelect: 'none' }}
            />
            {renderBoxes()}
            <div className="image-modal-points">
              {CLASSES.map((c) => (
                <div
                  key={c.color}
                  className={`image-modal-point ${c.color} ${activeClass === c.color ? 'active' : ''}`}
                  onClick={() => setActiveClass(c.color)}
                  style={{ borderWidth: activeClass === c.color ? 4 : 2, borderColor: activeClass === c.color ? '#222' : '#fff', cursor: 'pointer' }}
                ></div>
              ))}
            </div>
            <div className="image-modal-controls">
              <button className="undo-redo-btn" onClick={handleUndo} disabled={boxes.length === 0} title="Deshacer">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7 10H15.5C16.3284 10 17 10.6716 17 11.5V13.5C17 14.3284 16.3284 15 15.5 15H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7 10L9 8M7 10L9 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="undo-redo-btn" onClick={handleRedo} disabled={undoStack.length === 0} title="Rehacer">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13 10H4.5C3.67157 10 3 10.6716 3 11.5V13.5C3 14.3284 3.67157 15 4.5 15H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 10L11 8M13 10L11 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button className="btn btn-outline" onClick={handlePrev} disabled={modalIndex === 0}>Atrás</button>
              <button className="btn btn-primary" onClick={handleEnviar}>Enviar</button>
              <button className="btn btn-outline" onClick={handleNext} disabled={modalIndex === imagenes.length - 1}>Adelante</button>
            </div>
            <button className="image-modal-close" onClick={cerrarModal}>✖</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Vista1Persona;
