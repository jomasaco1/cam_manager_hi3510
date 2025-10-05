# app/camera_comms.py
import requests
from requests.auth import HTTPBasicAuth
import re
import time
import urllib.parse

# --- Configurações da Câmara ---
CAMERA_IP = "192.168.0.147"
CAMERA_USER = "admin"
CAMERA_PASS = "admin"
# O URL do snapshot pode variar, usamos o que indicou. Documentos também sugerem /web/tmpfs/snap.jpg [cite: 1033] ou /web/tmpfs/auto.jpg [cite: 609]
SNAPSHOT_URL = f"http://{CAMERA_IP}/tmpfs/auto.jpg"
CAMERA_BASE_URL = f"http://{CAMERA_IP}/cgi-bin/hi3510"
AUTH = HTTPBasicAuth(CAMERA_USER, CAMERA_PASS)
LOG_BASE_URL = f"http://{CAMERA_IP}/log" # URL base para os ficheiros de log
# --- Cache Simples em Memória ---
SETTINGS_CACHE = {}
SETTINGS_CACHE_DURATION = 30  # Cache de 30 segundos para configurações
SNAPSHOT_CACHE = {}
SNAPSHOT_CACHE_DURATION = 3600 # Cache de 1 hora 3600 para o snapshot

def _parse_camera_response(text):
    params = {}
    # Lida com respostas de linha única (var...;var...;) e múltiplas linhas
    lines = text.replace(';', '\n').splitlines()
    for line in lines:
        line = line.strip()
        if not line:
            continue
        if line.startswith('var '):
            line = line[4:]
        # A expressão regular foi melhorada para lidar com mais casos
        match = re.match(r'([^=\s]+)\s*=\s*"?([^"]*)"?', line)
        if match:
            key, value = match.groups()
            params[key.strip()] = value.strip()
    return params

def get_params_from_camera(command):
    """Função para obter parâmetros de configuração."""
    now = time.time()
    
    # Verifica o cache
    if command in SETTINGS_CACHE and (now - SETTINGS_CACHE[command]['timestamp']) < SETTINGS_CACHE_DURATION:
        return {'data': SETTINGS_CACHE[command]['data'], 'status': 'success', 'source': 'cache'}

    try:
        # Usa o unquote para garantir que comandos com '&' funcionem
        url = f"{CAMERA_BASE_URL}/param.cgi?cmd={urllib.parse.unquote(command)}"
        response = requests.get(url, auth=AUTH, timeout=5)
        response.raise_for_status()

        if "Error" in response.text:
             return {'error': f"A câmara retornou um erro: {response.text}", 'status': 'failed'}

        parsed_data = _parse_camera_response(response.text)
        SETTINGS_CACHE[command] = {'data': parsed_data, 'timestamp': now}
        
        return {'data': parsed_data, 'status': 'success', 'source': 'camera'}
    except requests.exceptions.RequestException as e:
        return {'error': f"Erro de comunicação com a câmara: {str(e)}", 'status': 'failed'}

def get_snapshot_from_camera():
    """Função para obter o snapshot, utilizando o cache de longa duração."""
    now = time.time()

    if 'snapshot' in SNAPSHOT_CACHE and (now - SNAPSHOT_CACHE['snapshot']['timestamp']) < SNAPSHOT_CACHE_DURATION:
        return {'data': SNAPSHOT_CACHE['snapshot']['data'], 'status': 'success', 'source': 'cache'}
    
    try:
        req = requests.get(SNAPSHOT_URL, auth=AUTH, timeout=5)
        req.raise_for_status()
        
        image_data = req.content
        SNAPSHOT_CACHE['snapshot'] = {'data': image_data, 'timestamp': now}
        
        return {'data': image_data, 'status': 'success', 'source': 'camera'}
    except requests.exceptions.RequestException as e:
        return {'error': f"Erro ao buscar o snapshot: {str(e)}", 'status': 'failed'}
        
def sync_system_log():
    """Envia o comando logsync para a câmara."""
    try:
        url = f"{CAMERA_BASE_URL}/param.cgi?cmd=logsync"
        response = requests.get(url, auth=AUTH, timeout=5)
        response.raise_for_status()
        return {'status': 'success'}
    except requests.exceptions.RequestException as e:
        return {'status': 'failed', 'error': str(e)}

def get_log_file(log_name):
    """Busca o conteúdo de um ficheiro de log da câmara."""
    try:
        # A obtenção dos ficheiros de log não parece usar o caminho /cgi-bin/
        url = f"http://{CAMERA_IP}/log/{log_name}"
        response = requests.get(url, auth=AUTH, timeout=5)
        response.raise_for_status()
        return {'status': 'success', 'data': response.text}
    except requests.exceptions.RequestException as e:
        return {'status': 'failed', 'error': str(e)}

def clear_system_log():
    """Envia o comando cleanlog para a câmara."""
    try:
        url = f"{CAMERA_BASE_URL}/param.cgi?cmd=cleanlog&-name=sys"
        response = requests.get(url, auth=AUTH, timeout=5)
        response.raise_for_status()
        # Invalida o cache do snapshot, pois limpar logs pode ser um evento importante
        if 'snapshot' in SNAPSHOT_CACHE:
            del SNAPSHOT_CACHE['snapshot']
        return {'status': 'success', 'data': response.text}
    except requests.exceptions.RequestException as e:
        return {'status': 'failed', 'error': str(e)}

def get_initial_params():
    """Busca o bloco de parâmetros necessários para inicializar o player."""
    # Este comando agrega vários pedidos num só, como a página original faz
    command = "getlanguage&cmd=getvideoattr&cmd=getvencattr&-chn=11&cmd=getvencattr&-chn=12&cmd=getsetupflag&cmd=getaudioflag"
    try:
        url = f"{CAMERA_BASE_URL}/param.cgi?cmd={command}"
        response = requests.get(url, auth=AUTH, timeout=5)
        response.raise_for_status()
        
        # A resposta é uma longa string de 'var ...;' que podemos injetar no HTML
        return {'status': 'success', 'data': response.text}

    except requests.exceptions.RequestException as e:
        return {'status': 'failed', 'error': str(e)}

def set_params_on_camera(command, params_dict):
    """Constrói o URL garantindo que os parâmetros têm apenas um hífen."""
    params_dict = {k: v for k, v in params_dict.items() if v is not None}
    query_parts = []
    for key, value in params_dict.items():
        # Chaves são passadas SEM hífen de api_routes.py (ex: 'name', não '-name')
        query_parts.append(f"-{key}={urllib.parse.quote(str(value))}")
    query_string = "&".join(query_parts)
    url = f"{CAMERA_BASE_URL}/param.cgi?cmd={command}&{query_string}"
    print(f"[DEBUG] Enviando comando: {url}")
    try:
        response = requests.get(url, auth=AUTH, timeout=10)
        response.raise_for_status()
        if "Error" in response.text:
            return {'error': f"A câmara retornou um erro: {response.text}", 'status': 'failed'}
        # Invalida caches relevantes após uma operação de escrita
        SETTINGS_CACHE.clear()
        return {'status': 'success', 'message': f"Comando '{command}' executado."}
    except requests.exceptions.RequestException as e:
        return {'error': f"Erro de comunicação: {str(e)}", 'status': 'failed'}
        
def set_multiple_params_on_camera(commands_to_run):
    """Executa uma lista de comandos 'set' em sequência."""
    for command, params in commands_to_run:
        result = set_params_on_camera(command, params)
        if result.get('status') == 'failed':
            return result
    return {'status': 'success', 'message': 'Todos os comandos foram executados com sucesso.'}
    
def get_public_ip_from_camera():
    url = f"http://{CAMERA_IP}/cgi-bin/param.cgi?cmd=getinterip"
    print(f"[DEBUG] Tentando obter IP público do URL (com autenticação): {url}")
    try:
        response = requests.get(url, auth=AUTH, timeout=30)
        response.raise_for_status()
        if "Error" in response.text:
             return {'error': f"A câmara retornou um erro: {response.text}", 'status': 'failed'}
        parsed_data = _parse_camera_response(response.text)
        if not parsed_data.get('interip'):
            return {'error': 'A câmara não conseguiu determinar o IP público.', 'status': 'failed'}
        return {'data': parsed_data, 'status': 'success', 'source': 'camera'}
    except requests.exceptions.Timeout:
        return {'error': "Timeout: A câmara demorou demasiado tempo a responder.", 'status': 'failed'}
    except requests.exceptions.RequestException as e:
        return {'error': f"Erro de comunicação com a câmara: {str(e)}", 'status': 'failed'}

def post_file_to_camera(cgi_file, file_to_upload):
    """Envia um ficheiro (firmware ou backup) para a câmara via POST."""
    url = f"{CAMERA_BASE_URL}/{cgi_file}"
    files = {'setting_file': (file_to_upload.filename, file_to_upload.stream, file_to_upload.mimetype)}
    
    try:
        # Usamos um timeout longo para uploads, especialmente para firmware
        response = requests.post(url, auth=AUTH, files=files, timeout=300)
        response.raise_for_status()
        
        # A câmara pode não retornar um JSON, mas sim uma página de sucesso/erro.
        # Verificamos por texto de erro comum.
        if "Error" in response.text or response.status_code != 200:
            return {'status': 'failed', 'error': f"A câmara retornou um erro: {response.text[:100]}"}

        return {'status': 'success', 'message': f"Ficheiro enviado para {cgi_file} com sucesso."}
    except requests.exceptions.RequestException as e:
        return {'status': 'failed', 'error': f"Erro de comunicação durante o upload: {str(e)}"}
        