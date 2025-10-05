# app/__init__.py
from flask import Flask, send_from_directory, Blueprint

def create_app():
    app = Flask(__name__)

    # Registar as rotas da aplicação
    from . import main_routes, api_routes, ptz_routes, alarm_routes, alarm_api_routes, status_api_routes
    app.register_blueprint(main_routes.main_bp)
    app.register_blueprint(api_routes.api_bp, url_prefix='/api')
    app.register_blueprint(ptz_routes.ptz_bp)
    app.register_blueprint(alarm_routes.alarm_bp) 
    app.register_blueprint(alarm_api_routes.alarm_api_bp, url_prefix='/api/alarms')
    app.register_blueprint(status_api_routes.status_api_bp, url_prefix='/api/status')

    js_proxy_bp = Blueprint('js_proxy', __name__)
    @js_proxy_bp.route('/js/<path:filename>')
    def serve_js_from_static(filename):
        return send_from_directory('static/js', filename)
    app.register_blueprint(js_proxy_bp)

    return app
