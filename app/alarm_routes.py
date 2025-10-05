# app/alarm_routes.py
from flask import Blueprint, render_template
from . import camera_comms

alarm_bp = Blueprint('alarm', __name__)

@alarm_bp.route('/alarmes')
def alarmes_page():
    """Renderiza a página de alarme, passando a resolução do stream principal."""
    # INÍCIO DA ALTERAÇÃO: Buscar as dimensões do stream principal (chn=11)
    main_stream_result = camera_comms.get_params_from_camera('getvencattr&-chn=11')
    
    main_stream_width = 1920  # Valor de fallback
    main_stream_height = 1080 # Valor de fallback

    if main_stream_result.get('status') == 'success':
        main_stream_width = main_stream_result['data'].get('width_1', main_stream_width)
        main_stream_height = main_stream_result['data'].get('height_1', main_stream_height)
    # FIM DA ALTERAÇÃO

    return render_template(
        'alarmes.html',
        main_stream_width=main_stream_width,
        main_stream_height=main_stream_height
    )