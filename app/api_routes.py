# app/api_routes.py
from flask import Blueprint, jsonify, request, Response
from . import camera_comms
from . import validation
import urllib.parse

api_bp = Blueprint('api', __name__)

@api_bp.route('/params/get/<path:command>')
def get_params_group(command):
    """Endpoint genérico da API para obter parâmetros. O comando é passado no URL."""
    # Descodifica o comando para lidar com caracteres como '&'
    decoded_command = urllib.parse.unquote(command)
    result = camera_comms.get_params_from_camera(decoded_command)
    
    if result.get('status') == 'failed':
        return jsonify(result), 500
        
    return jsonify(result)

@api_bp.route('/params/set/<command_name>', methods=['POST'])
def save_params_group(command_name):
    """Endpoint genérico da API para salvar parâmetros."""
    data = request.json
    params = data.get('params')

    if not command_name or not params:
        return jsonify({'status': 'failed', 'error': 'Dados inválidos.'}), 400

    sanitized_params = {}
    for key, value in params.items():
        sanitized_params[key] = validation.sanitize_and_validate(key, str(value))
    
    if command_name == 'setmdattr':
        sanitized_params['name'] = '1' # Específico para a área 1 da deteção de movimento
    if command_name == 'setvencattr':
        # O frontend deve enviar o 'chn' junto com os outros parâmetros
        pass

    result = camera_comms.set_params_on_camera(command_name, sanitized_params)

    if result.get('status') == 'failed':
        return jsonify(result), 500
        
    return jsonify(result)

@api_bp.route('/snapshot')
def snapshot_feed():
    """Esta rota serve o snapshot da câmara com cache de 1 hora."""
    result = camera_comms.get_snapshot_from_camera()

    if result.get('status') == 'failed':
        return "Erro ao buscar o snapshot", 500

    return Response(result['data'], mimetype='image/jpeg')

@api_bp.route('/logs/system')
def get_system_log_route():
    """Endpoint para sincronizar e obter o log do sistema."""
    camera_comms.sync_system_log() # Sincroniza primeiro
    result = camera_comms.get_log_file('syslog.txt') # Depois busca o ficheiro
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return Response(result['data'], mimetype='text/plain')

@api_bp.route('/logs/system/clear', methods=['POST'])
def clear_system_log_route():
    """Endpoint para limpar o log do sistema."""
    result = camera_comms.clear_system_log()
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)

@api_bp.route('/logs/process')
def get_process_log_route():
    """Endpoint para obter o log de processos."""
    result = camera_comms.get_log_file('proc.tmp')
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return Response(result['data'], mimetype='text/plain')

@api_bp.route('/ptz/control', methods=['POST'])
def ptz_control_route():
    """Endpoint para enviar comandos de movimento PTZ (up, down, stop, etc.)."""
    data = request.json
    action = data.get('action')
    speed = data.get('speed', 45)
    
    params = {'-act': action, '-speed': speed, '-step': 0}
    
    # AGORA CHAMA A NOVA FUNÇÃO com o nome do ficheiro .cgi correto
    result = camera_comms.send_action_to_camera('ptzctrl.cgi', params)

    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)

@api_bp.route('/ptz/preset', methods=['POST'])
def ptz_preset_route():
    """Endpoint para definir ou ir para um preset."""
    data = request.json
    action = data.get('action') # 'goto' ou 'set'
    number = data.get('number')

    if not all([action, number]):
        return jsonify({'status': 'failed', 'error': 'Ação e número do preset são obrigatórios.'}), 400

    params = {'-act': action, '-number': number}
    if action == 'set':
        params['-status'] = '1' # Status 1 para salvar

    # AGORA CHAMA A NOVA FUNÇÃO com o nome do ficheiro .cgi correto
    result = camera_comms.send_action_to_camera('preset.cgi', params)
    
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)
    
@api_bp.route('/ptz/tracking_settings', methods=['POST'])
def save_tracking_settings():
    """Salva as configurações de rastreamento inteligente e presets de alarme."""
    data = request.json
    
    # Parâmetros para o comando setsmartrackattr
    smartrack_params = {
        'smartrack_enable': data.get('smartrack_enable'),
        'smartrack_timeout': data.get('smartrack_timeout')
    }
    
    # Parâmetros para o comando setmotorattr
    motor_params = {
        'alarmpresetindex': data.get('alarmpresetindex'),
        'watchpresetindex': data.get('watchpresetindex')
    }
    
    # Validação simples
    if None in smartrack_params.values() or None in motor_params.values():
        return jsonify({'status': 'failed', 'error': 'Parâmetros em falta.'}), 400

    # Executa os dois comandos CGI
    result1 = camera_comms.set_params_on_camera('setsmartrackattr', smartrack_params)
    result2 = camera_comms.set_params_on_camera('setmotorattr', motor_params)

    if result1.get('status') == 'failed' or result2.get('status') == 'failed':
        return jsonify({
            'status': 'failed', 
            'error1': result1.get('error', ''),
            'error2': result2.get('error', '')
        }), 500

    return jsonify({'status': 'success', 'message': 'Configurações de rastreamento salvas com sucesso.'})

@api_bp.route('/video/set_all', methods=['POST'])
def save_video_settings():
    """Endpoint para salvar todas as configurações de vídeo de uma só vez."""
    data = request.json
    params = data.get('params')
    if not params:
        return jsonify({'status': 'failed', 'error': 'Dados inválidos.'}), 400

    # 1. Comando setvideoattr (resolução, norma, perfil)
    video_attr_params = {
        'videomode': validation.sanitize_and_validate('videomode', params.get('videomode')),
        'vinorm': validation.sanitize_and_validate('vinorm', params.get('vinorm')),
        'profile': validation.sanitize_and_validate('profile', params.get('profile'))
    }
    
    # 2. Comando setvencattr para o Stream Principal (chn=11)
    venc_main_params = {
        'chn': '11',
        'bps': validation.sanitize_and_validate('bps', params.get('bps_1')),
        'fps': validation.sanitize_and_validate('fps', params.get('fps_1')),
        'gop': validation.sanitize_and_validate('gop', params.get('gop_1')),
        'brmode': validation.sanitize_and_validate('brmode', params.get('brmode_1')),
        'imagegrade': validation.sanitize_and_validate('imagegrade', params.get('imagegrade_1'))
    }
    
    # 3. Comando setvencattr para o Stream Secundário (chn=12)
    venc_sub_params = {
        'chn': '12',
        'bps': validation.sanitize_and_validate('bps', params.get('bps_2')),
        'fps': validation.sanitize_and_validate('fps', params.get('fps_2')),
        'gop': validation.sanitize_and_validate('gop', params.get('gop_2')),
        'brmode': validation.sanitize_and_validate('brmode', params.get('brmode_2')),
        'imagegrade': validation.sanitize_and_validate('imagegrade', params.get('imagegrade_2'))
    }
    
    # Monta a lista de comandos para a nova função
    commands_to_run = [
        ('setvideoattr', video_attr_params),
        ('setvencattr', venc_main_params),
        ('setvencattr', venc_sub_params)
    ]
    
    result = camera_comms.set_multiple_params_on_camera(commands_to_run)
    
    if result.get('status') == 'failed':
        return jsonify(result), 500
        
    return jsonify(result)  

@api_bp.route('/network/set_all', methods=['POST'])
def save_network_settings():
    """Endpoint para salvar todas as configurações de rede de uma só vez."""
    data = request.json.get('params', {})

    # CORREÇÃO: Mapeia os nomes do formulário para os nomes esperados pela API
    netattr_params = {
        'dhcp': data.get('dhcpflag'),
        'ipaddr': data.get('ipaddr'),
        'netmask': data.get('netmask'),
        'gateway': data.get('gateway'),
        'dnsstat': data.get('dnsstat'),
        'fdnsip': data.get('fdnsip'),
        'sdnsip': data.get('sdnsip')
    }
    # Filtra chaves nulas
    netattr_params = {k: v for k, v in netattr_params.items() if v is not None}

    # Agrupa os outros parâmetros
    httpport_params = {'httpport': data.get('httpport')} if 'httpport' in data else None
    rtspport_params = {'rtspport': data.get('rtspport'), 'rtpport': data.get('rtpport')} if 'rtspport' in data else None
    rtspauth_params = {'rtsp_aenable': data.get('rtsp_aenable')} if 'rtsp_aenable' in data else None
    upnp_params = {'upm_enable': data.get('upm_enable')} if 'upm_enable' in data else None
    onvif_params = {
        'ov_enable': data.get('ov_enable'),
        'ov_port': data.get('ov_port'),
        'ov_authflag': data.get('ov_authflag'),
        'ov_forbitset': data.get('ov_forbitset')
    }
    onvif_params = {k: v for k, v in onvif_params.items() if v is not None}


    # Monta a lista de comandos a serem executados em sequência
    commands_to_run = [('setnetattr', netattr_params)]
    if httpport_params: commands_to_run.append(('sethttpport', httpport_params))
    if rtspport_params: commands_to_run.append(('setrtspport', rtspport_params))
    if rtspauth_params: commands_to_run.append(('setrtspauth', rtspauth_params))
    if upnp_params: commands_to_run.append(('setupnpattr', upnp_params))
    if onvif_params: commands_to_run.append(('setonvifattr', onvif_params))
    
    result = camera_comms.set_multiple_params_on_camera(commands_to_run)
    
    if result.get('status') == 'failed':
        return jsonify(result), 500
        
    return jsonify(result)

@api_bp.route('/network/get_public_ip', methods=['GET'])
def get_public_ip():
    """Busca e retorna o endereço IP público da câmara."""
    
    # CORREÇÃO: Chamar a função dedicada em vez da genérica
    result = camera_comms.get_public_ip_from_camera()

    if result.get('status') == 'failed':
        # A mensagem de erro agora vem da função de comunicação, que é mais detalhada
        return jsonify({'ip': result.get('error', 'Erro ao obter IP')}), 500
    
    return jsonify({'ip': result.get('data', {}).get('interip', 'N/A')})
    
@api_bp.route('/audio/set_all', methods=['POST'])
def save_audio_settings():
    """Endpoint para salvar as configurações principais de áudio de uma só vez."""
    data = request.json.get('params', {})
    # Comando para o Stream Principal
    aenc_main_params = {
        'chn': '11',
        'aeswitch': data.get('aeswitch_1'),
        'aeformat': data.get('aeformat_1')
    }
    # Comando para o Stream Secundário
    aenc_sub_params = {
        'chn': '12',
        'aeswitch': data.get('aeswitch_2'),
        'aeformat': data.get('aeformat_1') # O original parece usar o mesmo formato para ambos
    }
    # Comando para o Volume de Entrada
    audioin_params = {
        'volume': data.get('volume'),
        'volin_type': data.get('volin_type')
    }
    # Comando para o Volume de Saída
    audioout_params = {'ao_volume': data.get('ao_volume')}
    commands_to_run = [
        ('setaencattr', aenc_main_params),
        ('setaencattr', aenc_sub_params),
        ('setaudioinvolume', audioin_params),
        ('setaudiooutvolume', audioout_params)
    ]
    result = camera_comms.set_multiple_params_on_camera(commands_to_run)
    return jsonify(result)
    
@api_bp.route('/audio/set_alarm_sound', methods=['POST'])
def save_alarm_sound_settings():
    """Salva as configurações da sirene de alarme (ativação e tipo/duração)."""
    data = request.json.get('params', {})

    # Comando 1: Ativar/Desativar o som como uma ação de alarme
    md_sound_params = {
        'aname': 'sound',
        'switch': data.get('md_sound_switch')
    }

    # Comando 2: Configurar o tipo e duração do som
    sound_attr_params = {
        'sound_type': data.get('sound_type'),
        'sound_time': data.get('sound_time')
    }
    
    commands_to_run = [
        ('setmdalarm', md_sound_params),
        ('setalarmsoundattr', sound_attr_params)
    ]
    
    result = camera_comms.set_multiple_params_on_camera(commands_to_run)
    return jsonify(result)

@api_bp.route('/osd/set_all', methods=['POST'])
def save_osd_settings():
    """Salva as configurações para as regiões de OSD 0 e 1."""
    data = request.json.get('params', {})
    params_r0_in = data.get('region0', {})
    params_r1_in = data.get('region1', {})

    # Constrói um dicionário de parâmetros limpo e validado para a Região 0
    params_r0_out = {
        'region': '0',
        'show': params_r0_in.get('show'),
        'place': params_r0_in.get('place'),
        'format': params_r0_in.get('format'),
        'type': params_r0_in.get('type'),
        'x': params_r0_in.get('x'),
        'y': params_r0_in.get('y'),
        'name': params_r0_in.get('name')
    }
    
    # Constrói um dicionário de parâmetros limpo e validado para a Região 1
    params_r1_out = {
        'region': '1',
        'show': params_r1_in.get('show'),
        'place': params_r1_in.get('place'),
        'format': params_r1_in.get('format'),
        'type': params_r1_in.get('type'),
        'x': params_r1_in.get('x'),
        'y': params_r1_in.get('y'),
        'name': params_r1_in.get('name')
    }

    # Filtra quaisquer valores None antes de enviar
    commands_to_run = [
        ('setoverlayattr', {k: v for k, v in params_r0_out.items() if v is not None}),
        ('setoverlayattr', {k: v for k, v in params_r1_out.items() if v is not None})
    ]
    
    result = camera_comms.set_multiple_params_on_camera(commands_to_run)
    return jsonify(result)

@api_bp.route('/covers/set_all', methods=['POST'])
def save_cover_settings():
    """Salva as configurações para todas as 4 máscaras de privacidade."""
    data = request.json.get('params', {})
    commands_to_run = []

    for i in range(1, 5): # Itera sobre as regiões 1, 2, 3, 4
        cover_params = {
            'region': str(i),
            'show': data.get(f'show_{i}'),
            'color': data.get(f'color_{i}', '000000').lstrip('#'),
            'x': data.get(f'x_{i}'),
            'y': data.get(f'y_{i}'),
            'w': data.get(f'w_{i}'),
            'h': data.get(f'h_{i}'),
        }
        cover_params = {k: v for k, v in cover_params.items() if v is not None}
        commands_to_run.append(('setcover', cover_params))        
    result = camera_comms.set_multiple_params_on_camera(commands_to_run)
    return jsonify(result)
    
@api_bp.route('/system/actions', methods=['POST'])
def system_actions():
    """Endpoint para ações como reiniciar, resetar ou fazer backup."""
    data = request.json
    action = data.get('action')

    if action == 'reboot':
        result = camera_comms.send_action_to_camera('sysreboot.cgi', {})
    elif action == 'reset':
        result = camera_comms.send_action_to_camera('sysreset.cgi', {})
    # A ação de backup não precisa de parâmetros, apenas de uma chamada GET
    elif action == 'backup':
        # Esta ação não retorna JSON, mas sim um ficheiro para download.
        # O tratamento será feito no lado do cliente (JavaScript).
        # Apenas retornamos sucesso para que o JS possa abrir o URL de download.
        return jsonify({'status': 'success', 'url': '/cgi-bin/hi3510/backup.cgi'})
    else:
        return jsonify({'status': 'failed', 'error': 'Ação inválida.'}), 400

    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)
    
@api_bp.route('/system/upload/<action_type>', methods=['POST'])
def system_upload(action_type):
    """Endpoint para fazer upload do firmware (upgrade) ou configurações (restore)."""
    if 'file' not in request.files:
        return jsonify({'status': 'failed', 'error': 'Nenhum ficheiro enviado.'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'status': 'failed', 'error': 'Nome do ficheiro vazio.'}), 400

    if action_type == 'upgrade':
        cgi_file = 'upgrade.cgi'
    elif action_type == 'restore':
        cgi_file = 'restore.cgi'
    else:
        return jsonify({'status': 'failed', 'error': 'Tipo de ação de upload inválido.'}), 400

    # A função post_file_to_camera precisa ser criada em camera_comms.py
    result = camera_comms.post_file_to_camera(cgi_file, file)

    if result.get('status') == 'failed':
        return jsonify(result), 500
        
    return jsonify(result)    

@api_bp.route('/system/time', methods=['GET'])
def get_system_time():
    """Obtém as configurações de data, hora e NTP."""
    command = "getservertime&cmd=getntpattr"
    result = camera_comms.get_params_from_camera(command)
    
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)

@api_bp.route('/system/time', methods=['POST'])
def set_system_time():
    """Salva as configurações de data, hora e NTP."""
    data = request.json.get('params', {})
    
    time_params = {
        'time': data.get('time'),
        'timezone': data.get('timeZone'),
        'dstmode': data.get('dstmode')
    }
    ntp_params = {
        'ntpenable': data.get('ntpenable'),
        'ntpserver': data.get('ntpserver'),
        'ntpinterval': data.get('ntpinterval')
    }
    commands_to_run = [
        ('setservertime', {k: v for k, v in time_params.items() if v is not None}),
        ('setntpattr', {k: v for k, v in ntp_params.items() if v is not None})
    ]
    result = camera_comms.set_multiple_params_on_camera(commands_to_run)
    
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)

@api_bp.route('/system/info', methods=['GET'])
def get_system_info():
    """
    REFINADO: Obtém informações detalhadas do sistema, incluindo estado,
    capabilities e idioma, num só pedido.
    """
    # Usamos o comando combinado exato que você forneceu, que é mais eficiente.
    command = "getserverinfo&cmd=getcapability&cmd=getlanguage&cmd=getsetupflag&cmd=getservertime&cmd=getntpattr"
    result = camera_comms.get_params_from_camera(command)
    
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)

@api_bp.route('/language', methods=['POST'])
def set_language():
    """Define o idioma na câmara."""
    data = request.json.get('params', {})
    # O comando 'setlanguage' é uma suposição comum para esta arquitetura.
    result = camera_comms.set_params_on_camera('setlanguage', data)
    if result.get('status') == 'failed':
        return jsonify(result), 500
    return jsonify(result)    