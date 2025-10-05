# app/alarm_api_routes.py
from flask import Blueprint, jsonify, request
from . import camera_comms

alarm_api_bp = Blueprint('alarm_api', __name__)

# --- Endpoint para Deteção de Movimento ---
@alarm_api_bp.route('/motion_detection', methods=['GET', 'POST'])
def handle_motion_detection():
    if request.method == 'GET':
        result = camera_comms.get_params_from_camera('getmdattr')
        return jsonify(result)

    if request.method == 'POST':
        data = request.json
        commands_to_run = []
        for i in range(1, 5):
            area_data = data.get(f'area{i}', {})

            # --- INÍCIO DA CORREÇÃO ---
            # Se a área estiver desativada, não importa as coordenadas, mas elas
            # não podem ser vazias para evitar erros no CGI.
            # Se estiver ativa, também garantimos um valor padrão para o caso de algo falhar.
            params = {
                'name': str(i),
                'enable': area_data.get('enable', '0'),
                's': area_data.get('sensitivity') or '50', # Garante um valor padrão
                'x': area_data.get('x') or '0', # Se 'x' for vazio ou nulo, usa '0'
                'y': area_data.get('y') or '0', # Se 'y' for vazio ou nulo, usa '0'
                'w': area_data.get('w') or '0', # Se 'w' for vazio ou nulo, usa '0'
                'h': area_data.get('h') or '0', # Se 'h' for vazio ou nulo, usa '0'
            }
            # --- FIM DA CORREÇÃO ---

            commands_to_run.append(('setmdattr', params))
        
        result = camera_comms.set_multiple_params_on_camera(commands_to_run)
        return jsonify(result)

# --- Endpoint para Ações de Alarme ---
@alarm_api_bp.route('/actions', methods=['GET', 'POST'])
def handle_alarm_actions():
    # ALTERAÇÃO: Adicionar os novos nomes à lista
    action_names = [
        'snap', 'record', 'emailsnap', 'ftpsnap', 'ftprec', 'relay', 
        'emailrec', 'server', 'preset'
    ]
    
    if request.method == 'GET':
        # O resto da função não precisa de alterações
        command_string = "&cmd=".join([f"getmdalarm&-aname={name}" for name in action_names])
        result = camera_comms.get_params_from_camera(command_string)
        return jsonify(result)

    if request.method == 'POST':
        # O resto da função não precisa de alterações
        data = request.json
        commands_to_run = []
        for name in action_names:
            is_enabled = data.get(name, False)
            params = {'aname': name, 'switch': 'on' if is_enabled else 'off'}
            commands_to_run.append(('setmdalarm', params))
            
        result = camera_comms.set_multiple_params_on_camera(commands_to_run)
        return jsonify(result)

# --- Endpoint para Agendamento ---
@alarm_api_bp.route('/schedule', methods=['GET', 'POST'])
def handle_schedule():
    if request.method == 'GET':
        result = camera_comms.get_params_from_camera('getscheduleex&-ename=md')
        return jsonify(result)

    if request.method == 'POST':
        data = request.json
        params = {'ename': 'md'}
        params.update(data)
        result = camera_comms.set_params_on_camera('setscheduleex', params)
        return jsonify(result)
        
# --- Endpoint para IO, PIR e Som ---
@alarm_api_bp.route('/io_settings', methods=['GET', 'POST'])
def handle_io_settings():
    if request.method == 'GET':
        io_result = camera_comms.get_params_from_camera('getioattr')
        pir_result = camera_comms.get_params_from_camera('getpirattr')
        audio_result = camera_comms.get_params_from_camera('getaudioalarmattr')
        if io_result['status'] == 'failed' or pir_result['status'] == 'failed' or audio_result['status'] == 'failed':
            return jsonify({'status': 'failed', 'error': 'Falha ao obter um ou mais parâmetros de IO/PIR/Audio.'}), 500
        combined_data = {**io_result['data'], **pir_result['data'], **audio_result['data']}
        return jsonify({'status': 'success', 'data': combined_data})

    if request.method == 'POST':
        data = request.json
        commands_to_run = [
            ('setioattr', {'io_enable': data.get('io_enable'), 'io_flag': data.get('io_flag')}),
            ('setpirattr', {'pir_enable': data.get('pir_enable')}),
            ('setaudioalarmattr', {'aa_enable': data.get('aa_enable'), 'aa_value': data.get('aa_value')})
        ]
        result = camera_comms.set_multiple_params_on_camera(commands_to_run)
        return jsonify(result)

# Em app/alarm_api_routes.py, substitua a função handle_smart_features por esta:

@alarm_api_bp.route('/smart_features', methods=['GET', 'POST'])
def handle_smart_features():
    if request.method == 'GET':
        track_result = camera_comms.get_params_from_camera('getsmartrackattr')
        smdex_result = camera_comms.get_params_from_camera('getsmdex')
        smdattr_result = camera_comms.get_params_from_camera('getsmdattr')
        if track_result['status'] == 'failed' or smdex_result['status'] == 'failed' or smdattr_result['status'] == 'failed':
            return jsonify({'status': 'failed', 'error': 'Falha ao obter um ou mais parâmetros inteligentes.'}), 500
        combined_data = {
            **track_result['data'],
            **smdex_result['data'],
            **smdattr_result['data']
        }
        return jsonify({'status': 'success', 'data': combined_data})
    if request.method == 'POST':
        data = request.json
        commands_to_run = [
            ('setsmartrackattr', {
                'smartrack_enable': data.get('smartrack_enable'),
                'smartrack_timeout': data.get('smartrack_timeout')
            }),
            ('setsmdex', {
                'smd_gthresh': data.get('smd_gthresh'),
                'smd_rect': data.get('smd_rect')
            }),
            ('setsmdattr', {
                'smd_enable': data.get('smd_enable'),
                'smd_threshold': data.get('smd_threshold'),
                'smd_x': data.get('smd_x'),
                'smd_y': data.get('smd_y'),
                'smd_w': data.get('smd_w'),
                'smd_h': data.get('smd_h')
            })
        ]
        result = camera_comms.set_multiple_params_on_camera(commands_to_run)
        return jsonify(result)
        
@alarm_api_bp.route('/snapshot_settings', methods=['GET', 'POST'])
def handle_snapshot_settings():
    if request.method == 'GET':
        result = camera_comms.get_params_from_camera('getalarmsnapattr')
        return jsonify(result)

    if request.method == 'POST':
        data = request.json
        params = {
            'snap_count': data.get('snap_count'),
            'snap_name_mode': data.get('snap_name_mode'),
            'snap_alarm_name': data.get('snap_alarm_name')
        }
        result = camera_comms.set_params_on_camera('setalarmsnapattr', params)
        return jsonify(result)
        
@alarm_api_bp.route('/relay_settings', methods=['GET', 'POST'])
def handle_relay_settings():
    """
    Obtém ou define as configurações de duração do relé de alarme.
    """
    if request.method == 'GET':
        result = camera_comms.get_params_from_camera('getrelayattr')
        return jsonify(result)

    if request.method == 'POST':
        data = request.json
        params = {
            'time': data.get('time')
        }
        result = camera_comms.set_params_on_camera('setrelayattr', params)
        return jsonify(result)        