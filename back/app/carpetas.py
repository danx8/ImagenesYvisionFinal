from flask import Blueprint, request, jsonify, send_file, Response
import os
from werkzeug.utils import secure_filename
import cv2
import numpy as np
import io
from .cargarModelo import cargarModelo
from .reconocimiento import procesar_carpeta_con_arduino, ARDUINO_URL
import base64
import json
import requests
import time

carpetas = Blueprint('carpetas', __name__)

# ------------------ CONFIGURACIÓN GENERAL ------------------

# Carpetas de almacenamiento
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'videos')
FRAMES_FOLDER = os.path.join(BASE_DIR, 'imagenes')

ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'wmv'}

# Crear carpetas si no existen
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(FRAMES_FOLDER, exist_ok=True)

print(f"Carpeta de videos: {UPLOAD_FOLDER}")
print(f"Carpeta de imágenes: {FRAMES_FOLDER}")

# ------------------ FUNCIONES AUXILIARES ------------------

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def extraer_frames(video_path, output_folder, intervalo_ms=42):
    # Crear carpeta para los frames si no existe
    os.makedirs(output_folder, exist_ok=True)
    
    # Abrir el video
    video = cv2.VideoCapture(video_path)
    
    if not video.isOpened():
        raise Exception(f"No se pudo abrir el video: {video_path}")
    
    # Obtener FPS y duración total
    fps = video.get(cv2.CAP_PROP_FPS)
    total_frames = int(video.get(cv2.CAP_PROP_FRAME_COUNT))
    duracion_total = total_frames / fps * 1000  # en milisegundos
    
    # Inicializar contador
    contador = 0
    tiempo_actual = 0
    
    # Extraer frames
    while tiempo_actual < duracion_total:
        # Posicionar el video en el tiempo actual
        video.set(cv2.CAP_PROP_POS_MSEC, tiempo_actual)
        
        # Leer el frame
        exito, frame = video.read()
        
        if not exito:
            break
        
        # Guardar el frame
        nombre_imagen = os.path.join(output_folder, f"frame_{contador:04d}.jpg")
        cv2.imwrite(nombre_imagen, frame)
        
        # Avanzar en el tiempo y el contador
        tiempo_actual += intervalo_ms
        contador += 1
    
    # Liberar el video
    video.release()
    
    return contador

# ------------------ RUTAS PARA VIDEOS ------------------

@carpetas.route('/subir-video', methods=['POST'])
def subir_video():
    try:
        if 'video' not in request.files:
            return jsonify({'error': 'No se encontró el archivo'}), 400

        file = request.files['video']
        if file.filename == '':
            return jsonify({'error': 'No se seleccionó ningún archivo'}), 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            return jsonify({'mensaje': 'Video subido exitosamente'}), 200

        return jsonify({'error': 'Tipo de archivo no permitido'}), 400
    except Exception as e:
        return jsonify({'error': f'Error al subir el video: {str(e)}'}), 500

@carpetas.route('/videos', methods=['GET'])
def listar_videos():
    try:
        videos = [f for f in os.listdir(UPLOAD_FOLDER) if os.path.isfile(os.path.join(UPLOAD_FOLDER, f))]
        return jsonify(videos), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@carpetas.route('/recortar-video', methods=['POST'])
def recortar_video():
    try:
        data = request.get_json()
        video_name = data.get('videoName')
        milisegundos = data.get('milisegundos', 42)  # Valor por defecto: 42ms
        
        if not video_name:
            return jsonify({'error': 'No se especificó el nombre del video'}), 400
            
        # Obtener el nombre base del video (sin extensión)
        video_base_name = os.path.splitext(video_name)[0]
        
        # Crear carpeta específica para este video
        video_frames_folder = os.path.join(FRAMES_FOLDER, video_base_name)
        
        # Ruta completa del video
        video_path = os.path.join(UPLOAD_FOLDER, video_name)
        
        if not os.path.exists(video_path):
            return jsonify({'error': 'El video no existe'}), 404
            
        # Extraer frames
        num_frames = extraer_frames(video_path, video_frames_folder, milisegundos)
        
        return jsonify({
            'mensaje': f'Se extrajeron {num_frames} frames del video {video_name}',
            'frames_folder': video_frames_folder
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Error al procesar el video: {str(e)}'}), 500

# ------------------ RUTA PARA PROCESAR UNA IMAGEN ------------------

# Cargar el modelo una sola vez usando cargarModelo
model = cargarModelo()

@carpetas.route('/procesar-imagen', methods=['POST'])
def procesar_imagen():
    try:
        if 'imagen' not in request.files:
            return jsonify({'error': 'No se envió ninguna imagen'}), 400

        imagen = request.files['imagen']
        if imagen.filename == '':
            return jsonify({'error': 'Nombre de archivo vacío'}), 400

        # Leer la imagen directamente en memoria
        file_bytes = imagen.read()
        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # Procesar con el modelo
        results = model(img)
        result = results[0]
        imagen_anotada = result.plot()

        # Convertir la imagen procesada a bytes
        _, buffer = cv2.imencode('.jpg', imagen_anotada)
        img_bytes = io.BytesIO(buffer)

        # Devolver la imagen procesada
        return send_file(
            img_bytes,
            mimetype='image/jpeg',
            as_attachment=False
        )

    except Exception as e:
        return jsonify({'error': f'Error al procesar la imagen: {str(e)}'}), 500

@carpetas.route('/reconocer-carpeta', methods=['GET'])
def reconocer_carpeta():
    try:
        nombre_carpeta = request.args.get('nombre_carpeta')
        if not nombre_carpeta:
            return jsonify({'error': 'No se especificó la carpeta'}), 400

        def generate():
            carpeta_imagenes = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'imagenes', nombre_carpeta)
            if not os.path.exists(carpeta_imagenes):
                yield f"data: {json.dumps({'error': f'La carpeta {carpeta_imagenes} no existe'})}\n\n"
                return

            archivos = [f for f in os.listdir(carpeta_imagenes) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            archivos.sort()

            model = cargarModelo()
            session = requests.Session()

            for nombre_archivo in archivos:
                ruta_imagen = os.path.join(carpeta_imagenes, nombre_archivo)
                image = cv2.imread(ruta_imagen)
                if image is None:
                    continue

                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                results = model(image_rgb)
                result = results[0]
                imagen_anotada = result.plot()

                # Obtener las clases detectadas
                clases_detectadas = set()
                for box in result.boxes:
                    nombre_clase = result.names[box.cls.item()]
                    confianza = box.conf.item()
                    print(f"Clase: {nombre_clase} - Confianza: {confianza:.2f}")
                    clases_detectadas.add(nombre_clase)

                # Encender LEDs para las clases detectadas
                for clase in clases_detectadas:
                    try:
                        response = session.get(ARDUINO_URL + clase)
                        print(f"Enviando señal para {clase}: {response.status_code}")
                    except Exception as e:
                        print(f"Error al enviar petición para {clase}: {e}")

                # Convertir la imagen procesada a base64
                _, buffer = cv2.imencode('.jpg', imagen_anotada)
                img_base64 = base64.b64encode(buffer).decode('utf-8')

                # Enviar la imagen y las clases detectadas
                data = {
                    'imagen': img_base64,
                    'clases': list(clases_detectadas),
                    'nombre_archivo': nombre_archivo
                }
                yield f"data: {json.dumps(data)}\n\n"

                # Mantener encendido un breve momento
                time.sleep(1)

                # Apagar LEDs
                try:
                    response = session.get(ARDUINO_URL + "off")
                    print(f"Apagando LEDs: {response.status_code}")
                except Exception as e:
                    print(f"Error al enviar petición para apagar LEDs: {e}")

        return Response(generate(), mimetype='text/event-stream')

    except Exception as e:
        return jsonify({'error': f'Error al procesar la carpeta: {str(e)}'}), 500

@carpetas.route('/listar-carpetas-imagenes', methods=['GET'])
def listar_carpetas_imagenes():
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        imagenes_dir = os.path.join(base_dir, 'imagenes')
        print(f"Buscando carpetas en: {imagenes_dir}")
        carpetas = [nombre for nombre in os.listdir(imagenes_dir) if os.path.isdir(os.path.join(imagenes_dir, nombre))]
        print(f"Carpetas encontradas: {carpetas}")
        return jsonify({'carpetas': carpetas}), 200
    except Exception as e:
        print(f"Error al listar carpetas: {e}")
        return jsonify({'error': f'Error al listar carpetas: {str(e)}'}), 500

@carpetas.route('/listar-imagenes/<nombre_carpeta>', methods=['GET'])
def listar_imagenes(nombre_carpeta):
    try:
        carpeta_imagenes = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'imagenes', nombre_carpeta)
        if not os.path.exists(carpeta_imagenes):
            return jsonify({'error': f'La carpeta {carpeta_imagenes} no existe'}), 404

        archivos = [f for f in os.listdir(carpeta_imagenes) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
        archivos.sort()

        imagenes_info = []
        for nombre_archivo in archivos:
            ruta_imagen = os.path.join(carpeta_imagenes, nombre_archivo)
            with open(ruta_imagen, 'rb') as img_file:
                img_base64 = base64.b64encode(img_file.read()).decode('utf-8')
                imagenes_info.append({'nombre': nombre_archivo, 'base64': img_base64})

        return jsonify({'imagenes': imagenes_info}), 200
    except Exception as e:
        return jsonify({'error': f'Error al listar imágenes: {str(e)}'}), 500

@carpetas.route('/guardar-labels', methods=['POST'])
def guardar_labels():
    try:
        data = request.get_json()
        nombre_carpeta = data.get('nombre_carpeta')
        nombre_imagen = data.get('nombre_imagen')
        contenido_labels = data.get('contenido_labels')

        if not nombre_carpeta or not nombre_imagen or not contenido_labels:
            return jsonify({'error': 'Faltan datos necesarios'}), 400

        carpeta_imagenes = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'imagenes', nombre_carpeta)
        carpeta_labels = os.path.join(carpeta_imagenes, 'labels')
        os.makedirs(carpeta_labels, exist_ok=True)

        nombre_label = os.path.splitext(nombre_imagen)[0] + '.txt'
        ruta_label = os.path.join(carpeta_labels, nombre_label)

        with open(ruta_label, 'w') as f:
            f.write(contenido_labels)

        return jsonify({'mensaje': 'Labels guardados exitosamente'}), 200
    except Exception as e:
        return jsonify({'error': f'Error al guardar labels: {str(e)}'}), 500
