from flask import request, jsonify

def manejar_mensaje():
    data = request.get_json()
    mensaje = data.get('mensaje', '')
    print(f"Recibido: {mensaje}")