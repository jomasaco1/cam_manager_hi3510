# app/status_api_routes.py
from flask import Blueprint, jsonify
from . import camera_comms

status_api_bp = Blueprint('status_api', __name__)

@status_api_bp.route('/prerequisites')
def get_prerequisites():
    """
    Verifica o estado de vários pré-requisitos (SD, SMTP, FTP, PTZ Preset, Servidor de Alarme)
    numa única chamada de API e de forma mais robusta.
    """
    # Executa todos os comandos CGI necessários
    server_info = camera_comms.get_params_from_camera('getserverinfo')
    smtp_attr = camera_comms.get_params_from_camera('getsmtpattr')
    ftp_attr = camera_comms.get_params_from_camera('getftpattr')
    motor_attr = camera_comms.get_params_from_camera('getmotorattr')
    alarm_server_attr = camera_comms.get_params_from_camera('getalarmserverattr')

    # --- INÍCIO DA CORREÇÃO: Lógica defensiva ---

    # Valida o estado do Cartão SD
    sd_ready = False
    if server_info.get('status') == 'success' and server_info['data'].get('sdstatus') == 'Ready':
        sd_ready = True

    # Valida se o SMTP (Email) está configurado
    smtp_configured = False
    if smtp_attr.get('status') == 'success' and smtp_attr['data'].get('ma_server') and smtp_attr['data'].get('ma_from') and smtp_attr['data'].get('ma_to'):
        smtp_configured = True

    # Valida se o FTP está configurado
    ftp_configured = False
    if ftp_attr.get('status') == 'success' and ftp_attr['data'].get('ft_server') and ftp_attr['data'].get('ft_username'):
        ftp_configured = True
            
    # Valida se o Preset de Alarme PTZ está configurado
    ptz_preset_configured = False
    alarm_preset_index = "N/A"
    if motor_attr.get('status') == 'success':
        index_str = motor_attr['data'].get('alarmpresetindex', '0')
        # Garante que o índice é um número e maior que 0
        if index_str.isdigit() and int(index_str) > 0:
            ptz_preset_configured = True
            alarm_preset_index = int(index_str)

    # Valida se o Servidor de Alarme está configurado
    alarm_server_configured = False
    if alarm_server_attr.get('status') == 'success' and alarm_server_attr['data'].get('as_server'):
        alarm_server_configured = True
            
    response_data = {
        'sd_ready': sd_ready,
        'smtp_configured': smtp_configured,
        'ftp_configured': ftp_configured,
        'ptz_preset_configured': ptz_preset_configured,
        'alarm_preset_index': alarm_preset_index,
        'alarm_server_configured': alarm_server_configured
    }

    # --- FIM DA CORREÇÃO ---

    return jsonify({'status': 'success', 'data': response_data})