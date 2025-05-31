from .cargarModelo import cargarModelo
import cv2
import os
import requests
import numpy as np
import matplotlib.pyplot as plt
import time

ARDUINO_URL = "http://192.168.0.38/"

model = cargarModelo()

# Procesa todas las imágenes de una carpeta, envía clases al Arduino, muestra en matplotlib y retorna imágenes procesadas como bytes

def procesar_carpeta_con_arduino(nombre_carpeta):
    carpeta_imagenes = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'imagenes', nombre_carpeta)
    imagenes_procesadas = []
    session = requests.Session()

    if not os.path.exists(carpeta_imagenes):
        raise Exception(f"La carpeta {carpeta_imagenes} no existe")

    archivos = [f for f in os.listdir(carpeta_imagenes) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
    archivos.sort()  # Ordenar para reproducir en orden

    plt.ion()
    fig = plt.figure()

    for nombre_archivo in archivos:
        ruta_imagen = os.path.join(carpeta_imagenes, nombre_archivo)
        image = cv2.imread(ruta_imagen)
        if image is None:
            print(f"No se pudo leer la imagen: {ruta_imagen}")
            continue

        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        results = model(image_rgb)
        result = results[0]
        imagen_anotada = result.plot()

        # Mostrar la imagen con detecciones en tiempo real
        plt.imshow(imagen_anotada)
        plt.axis("off")
        plt.title(f"Detección en: {nombre_archivo}")
        plt.draw()
        plt.pause(0.1)
        plt.clf()

        # Obtener las clases detectadas (sin repeticiones)
        clases_detectadas = set()
        for box in result.boxes:
            nombre_clase = result.names[box.cls.item()]
            confianza = box.conf.item()
            print(f"Clase: {nombre_clase} - Confianza: {confianza:.2f}")
            clases_detectadas.add(nombre_clase)

        # Encender LEDs para todas las clases detectadas
        for clase in clases_detectadas:
            try:
                session.get(ARDUINO_URL + clase)
            except Exception as e:
                print(f"Error al enviar petición para {clase}: {e}")

        # Mantener encendido un breve momento para que sea visible
        time.sleep(1)

        # Apagar LEDs después
        try:
            session.get(ARDUINO_URL + "off")
        except Exception as e:
            print(f"Error al enviar petición para apagar LEDs: {e}")

        # Convertir la imagen procesada a bytes para enviar al frontend
        _, buffer = cv2.imencode('.jpg', imagen_anotada)
        imagenes_procesadas.append(buffer.tobytes())

    plt.ioff()
    plt.close()

    return imagenes_procesadas
