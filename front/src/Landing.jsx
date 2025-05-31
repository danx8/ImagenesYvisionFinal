import { useState, useEffect } from "react";
import axios from "axios";

export default function Landing() {
  const [file, setFile] = useState(null);
  const [videos, setVideos] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState("");
  const [milisegundos, setMilisegundos] = useState(42);

  useEffect(() => {
    cargarVideos();
  }, []);

  const cargarVideos = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/videos");
      setVideos(response.data);
    } catch (error) {
      setMensaje("No se pudieron cargar los videos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile && uploadedFile.type.startsWith("video/")) {
      setFile(uploadedFile);
      setMensaje("");
    } else {
      setMensaje("Por favor, selecciona un archivo de video válido");
      setFile(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMensaje("Por favor selecciona un video primero.");
      return;
    }
    const formData = new FormData();
    formData.append("video", file);
    setLoading(true);
    try {
      await axios.post("http://localhost:5000/api/subir-video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setMensaje("Video subido exitosamente");
      setFile(null);
      cargarVideos();
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || "Error al subir el video";
      setMensaje(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (event) => {
    const videoName = event.target.value;
    setSelectedVideo(videoName);
    setMensaje(`Seleccionaste: ${videoName}`);
  };

  const handleRecortar = async () => {
    if (!selectedVideo) {
      setMensaje("Por favor selecciona un video primero");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/recortar-video", {
        videoName: selectedVideo,
        milisegundos: milisegundos
      });
      setMensaje(response.data.mensaje || "Video procesado exitosamente");
    } catch (error) {
      setMensaje(error.response?.data?.error || "Error al procesar el video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="upload-section">
        <h1>🎬 Subir Videos</h1>
        <form onSubmit={handleSubmit} className="upload-form">
          <label className="custom-file-input">
            <input
              type="file"
              onChange={handleFileChange}
              accept="video/*"
            />
            <span>Seleccionar video</span>
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Subiendo..." : "Subir video"}
          </button>
        </form>
        {file && (
          <div className="file-info">
            <strong>Video seleccionado:</strong> {file.name}
          </div>
        )}
        {mensaje && <div className="mensaje-estado">{mensaje}</div>}
      </div>

      <div className="videos-section">
        <h2>📂 Videos Disponibles</h2>
        {loading ? (
          <div className="loading">Cargando videos...</div>
        ) : videos.length === 0 ? (
          <div className="no-videos">No hay videos disponibles.</div>
        ) : (
          <>
            <select
              className="video-dropdown"
              onChange={handleVideoSelect}
              value={selectedVideo}
            >
              <option value="" disabled>
                Selecciona un video
              </option>
              {videos.map((video, index) => (
                <option key={index} value={video}>
                  {video}
                </option>
              ))}
            </select>
            {selectedVideo && (
              <>
                <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#fff' }}>
                    Intervalo entre frames (ms):
                  </label>
                  <input
                    type="number"
                    value={milisegundos}
                    onChange={(e) => setMilisegundos(Number(e.target.value))}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #ccc'
                    }}
                  />
                </div>
                <button 
                  onClick={handleRecortar} 
                  disabled={loading}
                  className="recortar-button"
                  style={{
                    background: '#fd7f01',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '0.5rem 1.5rem',
                    marginTop: '1rem',
                    width: '100%',
                    fontWeight: 'bold'
                  }}
                >
                  {loading ? "Procesando..." : "Recortar Video"}
                </button>
              </>
            )}
            <ul className="video-list">
              {videos.map((video, index) => (
                <li key={index} className="video-item">
                  <span role="img" aria-label="video">🎥</span> {video}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
