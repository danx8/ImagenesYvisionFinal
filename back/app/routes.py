from flask import Blueprint
from .mensaje import manejar_mensaje
from .calculo import manejar_calculo

main = Blueprint('main', __name__)

@main.route('/mensaje', methods=['POST'])
def ruta_mensaje():
    manejar_mensaje()
    return '',200

@main.route('/calculo', methods=['POST'])
def ruta_calculo():
    return manejar_calculo()
