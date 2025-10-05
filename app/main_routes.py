# app/main_routes.py
from flask import Blueprint, render_template, redirect, url_for
from . import camera_comms

main_bp = Blueprint('main', __name__)

def _get_player_params():
    """Função auxiliar para evitar código repetido nas rotas que usam o player de vídeo."""
    initial_params_result = camera_comms.get_initial_params()
    
    cam_config = {
        "ip": camera_comms.CAMERA_IP,
        "port": "80",
        "stream_type": "12" # Usar sempre o stream secundário para pré-visualizações
    }

    if initial_params_result['status'] == 'success':
        initial_script = initial_params_result['data']
    else:
        # Valores de fallback caso a câmara não responda
        initial_script = 'var width_2="640"; var height_2="352"; var name0="admin"; var password0="admin";'
        
    return {
        'initial_params_script': initial_script,
        'cam': cam_config
    }

@main_bp.route('/')
def index():
    """Renderiza a página inicial."""
    return render_template('index.html')

@main_bp.route('/ptz')
def ptz():
    """Renderiza a página de controlo PTZ."""
    player_params = _get_player_params()
    return render_template('ptz.html', **player_params)

# --- NOVAS ROTAS PARA AS CONFIGURAÇÕES ---

@main_bp.route('/settings')
def settings():
    """Rota antiga que agora redireciona para a primeira página de configurações."""
    return redirect(url_for('main.settings_image'))

@main_bp.route('/settings/image')
def settings_image():
    """Renderiza a página de configurações de Imagem."""
    player_params = _get_player_params() # Esta página tem um player de vídeo
    return render_template('image_settings.html', **player_params)

@main_bp.route('/settings/video')
def settings_video():
    """Renderiza a página de configurações de Vídeo."""
    player_params = _get_player_params() # Esta página também tem um player
    return render_template('video_settings.html', **player_params)

@main_bp.route('/settings/network')
def settings_network():
    """Renderiza a página de configurações de Rede."""
    # Esta página não tem player de vídeo, por isso não precisa dos parâmetros
    return render_template('network_settings.html')

@main_bp.route('/settings/audio')
def settings_audio():
    """Renderiza a página de configurações de Áudio e Som."""
    return render_template('audio_settings.html')
    
@main_bp.route('/settings/osd')
def settings_osd():
    """Renderiza a página de configurações de OSD e Máscaras de Privacidade."""
    return render_template('osd_settings.html')
    
@main_bp.route('/settings/system')
def settings_system():
    """Renderiza a página de configurações do Sistema."""
    return render_template('system_settings.html')    
   
# Adicione aqui futuras rotas de configurações, como:
# @main_bp.route('/settings/users')
# def settings_users():
#     return render_template('user_settings.html')