# app/validation.py

VALIDATION_RULES = {
    # --- Parâmetros de Imagem (setimageattr) ---
    "brightness":   {'type': int, 'min': 0, 'max': 100},
    "saturation":   {'type': int, 'min': 0, 'max': 255},
    "contrast":     {'type': int, 'min': 0, 'max': 100},
    "sharpness":    {'type': int, 'min': 0, 'max': 100},
    "hue":          {'type': int, 'min': 0, 'max': 100},
    "wdr":          {'type': str, 'options': ['on', 'off']},
    "wdrvalue":     {'type': int, 'min': 1, 'max': 30},
    "night":        {'type': str, 'options': ['on', 'off']},
    "flip":         {'type': str, 'options': ['on', 'off']},
    "mirror":       {'type': str, 'options': ['on', 'off']},
    "aemode":       {'type': int, 'options': [0, 1, 2]},
    "imgmode":      {'type': str, 'options': ['0', '1']}, # Adicionado
    "gamma":        {'type': str, 'options': ['0', '1']}, # Adicionado
    "noise":        {'type': str, 'options': ['0', '1']}, # Adicionado
    
    # --- Parâmetros de Correção de Lente (setldcattr) ---
    "ldc_enable":   {'type': str, 'options': ['0', '1']},
    "ldc_ratio":    {'type': int, 'min': 0, 'max': 511},

    # --- Parâmetros de Correção Fisheye (setfisheyeattr) ---
    "fisheye_flag": {'type': str, 'options': ['0', '1']},
    
    # --- Parâmetros de Vídeo (setvencattr) ---
    "bps":          {'type': int, 'min': 32, 'max': 8192},
    "fps":          {'type': int, 'min': 1, 'max': 30},
    "gop":          {'type': int, 'min': 2, 'max': 150},
    "imagegrade":   {'type': int, 'min': 1, 'max': 6},
    "brmode":       {'type': int, 'options': [0, 1]},
    "chn":          {'type': int, 'options': [11, 12]},
    "videomode":    {'type': int, 'min': 0, 'max': 200},
    "vinorm":       {'type': str, 'options': ['P', 'N']},
    "profile":      {'type': int, 'options': [0, 1, 2, 3]},
    # --- Parâmetros de Snapshot Móvel (setmobilesnapattr) ---
    "msize":        {'type': int, 'options': [1, 2]},
    # --- Parâmetros de Rede (setnetattr) ---
    "dhcpflag":     {'type': str, 'options': ['on', 'off']},
    "ip":           {'type': 'ip_address'}, # Tipo personalizado
    "netmask":      {'type': 'ip_address'},
    "gateway":      {'type': 'ip_address'},
    "dnsstat":      {'type': str, 'options': ['0', '1']},
    "fdnsip":       {'type': 'ip_address'},
    "sdnsip":       {'type': 'ip_address', 'allow_empty': True}, # Permitir DNS secundário vazio
    
    # --- Parâmetros de Portas ---
    "httpport":     {'type': int, 'min': 80, 'max': 65535},
    "rtspport":     {'type': int, 'min': 1, 'max': 65535},
    "rtpport":      {'type': int, 'min': 5000, 'max': 8000}, # Adicionado com base na documentação
    "rtsp_aenable": {'type': str, 'options': ['0', '1']},

    # --- Parâmetros UPnP (setupnpattr) ---
    "upm_enable":   {'type': str, 'options': ['0', '1']},

    # --- Parâmetros ONVIF (setonvifattr) ---
    "ov_enable":    {'type': str, 'options': ['0', '1']},
    "ov_port":      {'type': int, 'min': 1, 'max': 65535},
    "ov_authflag":  {'type': str, 'options': ['0', '1']},
    "ov_forbitset": {'type': int, 'options': [0, 1, 2, 3]},
    
        # --- Parâmetros de Áudio ---
    "audioflag":    {'type': str, 'options': ['0', '1']},
    "volume":       {'type': int, 'min': 1, 'max': 100},
    "volin_type":   {'type': str, 'options': ['0', '1']},
    "denoise":      {'type': str, 'options': ['0', '1']},
    "aec":          {'type': str, 'options': ['0', '1']},
    "ao_volume":    {'type': int, 'min': 1, 'max': 100},
    "aa_enable":    {'type': str, 'options': ['0', '1']},
    "aa_value":     {'type': int, 'min': 1, 'max': 100},
    "aeswitch_1":   {'type': str, 'options': ['0', '1']},
    "aeformat_1":   {'type': str, 'options': ['g711a', 'g726']},
    "aeswitch_2":   {'type': str, 'options': ['0', '1']},
    "md_sound_switch": {'type': str, 'options': ['on', 'off']},
    "sound_type":   {'type': int, 'options': [0, 1, 2]},
    "sound_time":   {'type': int, 'min': 1, 'max': 60},
     # --- Parâmetros de OSD (setoverlayattr) ---
    "show_0":       {'type': str, 'options': ['0', '1']},
    "place_0":      {'type': int, 'options': [0, 1, 2, 3]},
    "name_1":       {'type': str}, # Permitir texto
    "show_1":       {'type': str, 'options': ['0', '1']},
    "place_1":      {'type': int, 'options': [0, 1, 2, 3]},

    # --- Parâmetros de Máscaras (setcover) ---
    "show":         {'type': str, 'options': ['0', '1']},
    "color":        {'type': 'hex_color'}, # Tipo personalizado
    "x":            {'type': int, 'min': 0, 'max': 4000},
    "y":            {'type': int, 'min': 0, 'max': 4000},
    "w":            {'type': int, 'min': 0, 'max': 4000},
    "h":            {'type': int, 'min': 0, 'max': 4000},
    "region":       {'type': int, 'min': 1, 'max': 4},
}

def sanitize_and_validate(key, value):
    """
    Sanitiza e valida um valor com base nas regras definidas em VALIDATION_RULES.
    Se o valor estiver fora do intervalo, ele é ajustado para o limite mais próximo.
    """
    if key not in VALIDATION_RULES:
        return value

    rule = VALIDATION_RULES[key]
    
    if rule['type'] == int:
        try:
            clean_value = int(value)
        except (ValueError, TypeError):
            return str(rule.get('min', 0))

        if 'options' in rule and clean_value not in rule['options']:
             return str(rule['options'][0])

        if 'min' in rule:
            clean_value = max(rule['min'], clean_value)
        if 'max' in rule:
            clean_value = min(rule['max'], clean_value)
            
        return str(clean_value)
        
# Validação personalizada para endereços IP
    if rule['type'] == 'ip_address':
        # Permite valor vazio para campos opcionais
        if rule.get('allow_empty') and not value:
            return ""
            
        # Expressão regular simples para validar formato de IP
        ip_pattern = re.compile(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$")
        if ip_pattern.match(value):
            return value
        return "0.0.0.0" # Retorna um IP inválido/padrão em caso de erro        

    elif rule['type'] == str:
        clean_value = str(value).strip()
        if 'options' in rule and clean_value not in rule['options']:
            return rule['options'][0]
        return clean_value
        
    return value
    if rule.get('type') == 'hex_color':
        # Remove o '#' se presente e verifica o formato
        clean_value = value.lstrip('#')
        if re.match(r'^[0-9a-fA-F]{6}$', clean_value):
            return clean_value
        return "000000" # Retorna preto como padrão