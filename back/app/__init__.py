from flask import Flask
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)

    from .routes import main
    from .carpetas import carpetas
    
    app.register_blueprint(main)
    app.register_blueprint(carpetas, url_prefix='/api')

    return app
