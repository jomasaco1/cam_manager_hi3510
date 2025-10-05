# app/ptz_routes.py
from flask import Blueprint, render_template, abort
from . import camera_comms

ptz_bp = Blueprint('ptz', __name__)

@ptz_bp.route('/ptz')
def ptz_page():
    """Renderiza a página de controlo PTZ com os parâmetros iniciais."""
    result = camera_comms.get_initial_params()
    if result['status'] == 'failed':
        abort(500, description=f"Não foi possível obter os parâmetros iniciais da câmara: {result['error']}")

    camera_config = {
        'ip': camera_comms.CAMERA_IP,
        'port': 80, # Porta HTTP padrão
        'stream_type': 12 # 11=principal, 12=secundário
    }
    
    # Passamos os parâmetros da câmara e o bloco de script para o template
    return render_template('ptz.html', cam=camera_config, initial_params_script=result['data'])