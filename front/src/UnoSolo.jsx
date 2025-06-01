import { useState } from "react";
import axios from "axios";

export default function UnoSolo() {
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      setImagen(file);
      setPreview(URL.createObjectURL(file));
      setMensaje("");
      setResultado(null);
    } else {
      setMensaje("Por favor selecciona una imagen válida.");
      setImagen(null);
      setPreview(null);
    }
  };

  const handleCalcular = async () => {
    if (!imagen) {
      setMensaje("Primero debes seleccionar una imagen.");
      return;
    }

    const formData = new FormData();
    formData.append("imagen", imagen);
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/procesar-imagen", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob",
      });
      
      const resultImageUrl = URL.createObjectURL(response.data);
      setResultado(resultImageUrl);
      setMensaje("Imagen procesada correctamente");
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      setMensaje(error.response?.data?.error || "Error al procesar la imagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-container">
      <div className="upload-section">
        <h1>📷 Procesador de Imagen</h1>

        <div className="upload-form">
          <label className="custom-file-input">
            <span>Seleccionar archivo</span>
            <input type="file" accept="image/*" onChange={handleImagenChange} />
          </label>

          <button onClick={handleCalcular} disabled={loading}>
            {loading ? "Procesando..." : "Calcular"}
          </button>
        </div>

        {imagen && <div className="file-info">{imagen.name}</div>}

        {preview && (
          <>
            <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Imagen Original</h3>
            <img src={preview} alt="original" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', display: 'block', margin: '0 auto' }} />
          </>
        )}
        {resultado && (
          <>
            <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Imagen Procesada</h3>
            <img src={resultado} alt="resultado" style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '12px', display: 'block', margin: '0 auto' }} />
          </>
        )}

        {mensaje && <div className="mensaje-estado">{mensaje}</div>}
      </div>
    </div>
  );
}
