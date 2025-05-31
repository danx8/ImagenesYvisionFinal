from flask import request, jsonify

def manejar_calculo():
    data = request.get_json()
    x = data.get('x', 0)
    y = data.get('y', 0)
    resultado = x + y
    return jsonify({'resultado': resultado})
