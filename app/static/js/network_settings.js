// app/static/js/network_settings.js

/**
 * Adiciona os event listeners específicos para a aba de Rede.
 */
export function attachNetworkTabListeners() {
    const dhcpSelect = document.getElementById('dhcp-select');
    const dnsSelect = document.getElementById('dns-select');

    function toggleIpFields() {
        const isDhcpOn = dhcpSelect.value === 'on';
        // CORREÇÃO: Alterado de 'ip' para 'ipaddr' para corresponder ao HTML
        document.querySelector('input[name="ipaddr"]').disabled = isDhcpOn;
        document.querySelector('input[name="netmask"]').disabled = isDhcpOn;
        document.querySelector('input[name="gateway"]').disabled = isDhcpOn;

        // Lógica adicional: Se o DHCP for ligado, o DNS deve passar a automático
        if (isDhcpOn) {
            dnsSelect.value = '1';
            toggleDnsFields(); // Atualiza os campos de DNS
        }
    }

    function toggleDnsFields() {
        const isDnsManual = dnsSelect.value === '0';
        document.querySelector('input[name="fdnsip"]').disabled = !isDnsManual;
        document.querySelector('input[name="sdnsip"]').disabled = !isDnsManual;
    }

    if (dhcpSelect) {
        dhcpSelect.addEventListener('change', toggleIpFields);
    }
    if (dnsSelect) {
        dnsSelect.addEventListener('change', toggleDnsFields);
    }
	
	const checkIpBtn = document.getElementById('check-public-ip-btn');
    if (checkIpBtn) {
        checkIpBtn.addEventListener('click', async () => {
            const ipDisplay = document.getElementById('public-ip-display');
            ipDisplay.textContent = 'A verificar...';
            try {
                const response = await fetch('/api/network/get_public_ip');
                const result = await response.json();
                ipDisplay.textContent = result.ip || 'Não disponível';
            } catch (e) {
                ipDisplay.textContent = 'Falha na verificação.';
            }
        });
    }
}

/**
 * Gera o conteúdo HTML completo para a aba de configurações de Rede.
 * (Esta função permanece inalterada)
 */
export function renderNetworkTab(params) {
    const isDhcpOn = params.dhcpflag === 'on';
    const fieldsDisabled = isDhcpOn ? 'disabled' : '';
    // A lógica do DNS precisa de considerar se o DHCP está ligado
    const dnsManual = params.dnsstat === '0';
    const dnsDisabled = isDhcpOn || !dnsManual ? 'disabled' : '';

    return `
    <div class="settings-container">
        <div class="form-column">
            <form id="form-network-all" class="form-section">
                <h3>Rede com Fios (LAN)</h3>
                <div class="form-group">
                    <label>Obter IP via DHCP</label>
                    <select name="dhcpflag" id="dhcp-select">
                        <option value="on" ${isDhcpOn ? 'selected' : ''}>Ligado</option>
                        <option value="off" ${!isDhcpOn ? 'selected' : ''}>Desligado (IP Manual)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Endereço IP</label>
                    <input type="text" name="ipaddr" value="${params.ip || ''}" ${fieldsDisabled}>
                </div>
                <div class="form-group">
                    <label>Máscara de Sub-rede</label>
                    <input type="text" name="netmask" value="${params.netmask || ''}" ${fieldsDisabled}>
                </div>
                <div class="form-group">
                    <label>Gateway</label>
                    <input type="text" name="gateway" value="${params.gateway || ''}" ${fieldsDisabled}>
                </div>
                 <hr>
                <div class="form-group">
                    <label>Configuração DNS</label>
                    <select name="dnsstat" id="dns-select">
                        <option value="1" ${!dnsManual ? 'selected' : ''}>Automático (via DHCP)</option>
                        <option value="0" ${dnsManual ? 'selected' : ''}>Manual</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>DNS Primário</label>
                    <input type="text" name="fdnsip" value="${params.fdnsip || ''}" ${dnsDisabled}>
                </div>
                <div class="form-group">
                    <label>DNS Secundário</label>
                    <input type="text" name="sdnsip" value="${params.sdnsip || ''}" ${dnsDisabled}>
                </div>
                
                <hr>
                <h3>Portas de Serviço</h3>
                <div class="form-group"><label>Porta HTTP</label><input type="number" name="httpport" min="80" max="65535" value="${params.httpport || 80}"></div>
                <div class="form-group"><label>Porta RTSP</label><input type="number" name="rtspport" min="1" max="65535" value="${params.rtspport || 554}"></div>
                <div class="form-group"><label>Porta RTP</label><input type="number" name="rtpport" min="5000" max="8000" value="${params.rtpport || 6600}"></div>
                <div class="form-group">
                    <label>Autenticação RTSP</label>
                    <div class="radio-group">
                        <input type="radio" name="rtsp_aenable" value="1" ${params.rtsp_aenable === '1' ? 'checked' : ''}><label>Ligado</label>
                        <input type="radio" name="rtsp_aenable" value="0" ${params.rtsp_aenable === '0' ? 'checked' : ''}><label>Desligado</label>
                    </div>
                </div>

                <hr>
                <h3>Serviços de Rede</h3>
                <div class="form-group">
                    <label title="Permite a descoberta e configuração automática de portas no router.">UPnP</label>
                    <select name="upm_enable">
                        <option value="1" ${params.upm_enable === '1' ? 'selected' : ''}>Ligado</option>
                        <option value="0" ${params.upm_enable === '0' ? 'selected' : ''}>Desligado</option>
                    </select>
                </div>
                <div class="form-group">
                    <label title="Protocolo padrão para interoperabilidade com outros sistemas de vigilância.">ONVIF</label>
                    <select name="ov_enable">
                        <option value="1" ${params.ov_enable === '1' ? 'selected' : ''}>Ligado</option>
                        <option value="0" ${params.ov_enable === '0' ? 'selected' : ''}>Desligado</option>
                    </select>
                </div>
                 <div class="form-group">
                    <label>Porta ONVIF</label>
                    <input type="number" name="ov_port" min="1" max="65535" value="${params.ov_port || 8080}">
                </div>

                <button type="submit" style="width: 100%; margin-top: 20px;">Salvar Todas as Configurações de Rede</button>
            </form>
        </div>
        <div class="snapshot-column">
             <div class="info-section">
                <h4>Informação de Rede Atual</h4>
                <p><strong>Tipo de Conexão:</strong> ${params.networktype || 'N/A'}</p>
                <p><strong>Endereço MAC:</strong> ${params.macaddress || 'N/A'}</p>
                <hr>
                <p><strong>IP Público:</strong> <span id="public-ip-display">Não verificado</span></p>
                <button type="button" id="check-public-ip-btn" class="btn-secondary">Verificar IP Público</button>
            </div>
        </div>
    </div>`;
}