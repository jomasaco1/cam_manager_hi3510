document.addEventListener('DOMContentLoaded', function() {
    // --- Seletores de Elementos ---
    const rebootBtn = document.getElementById('reboot-btn');
    const resetBtn = document.getElementById('reset-btn');
    const backupBtn = document.getElementById('backup-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const upgradeBtn = document.getElementById('upgrade-btn');
    
    // Elementos de Data e Hora
    const saveTimeBtn = document.getElementById('save-time-btn');
    const syncPcBtn = document.getElementById('sync-pc-btn');
    const ntpEnableCheckbox = document.getElementById('ntpenable');
    const ntpSettingsDiv = document.getElementById('ntp-settings');
    const ntpServerSelect = document.getElementById('ntpserver');
    const ntpServerOtherContainer = document.getElementById('ntpserver-other-container');
    const ntpServerOtherInput = document.getElementById('ntpserver-other');
    const ntpIntervalSelect = document.getElementById('ntpinterval');
    
    // Elementos de Idioma
    const languageSelect = document.getElementById('language-select');
    const saveLanguageBtn = document.getElementById('save-language-btn');

    // Elementos de Logs e Informação
    const sysLogDisplay = document.getElementById('system-log-display');
    const refreshSysLogBtn = document.getElementById('refresh-syslog');
    const cleanSysLogBtn = document.getElementById('clean-syslog');
    const procLogDisplay = document.getElementById('process-log-display');
    const refreshProcLogBtn = document.getElementById('refresh-proclog');
    const infoContainer = document.getElementById('system-info-container');
	
	const dstmodeCheckbox = document.getElementById('dstmode');

    // Estado de loading
    let isLoading = false;

    // --- Funções Auxiliares ---
    function showLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>A processar...';
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }

    function formatBytes(bytes) {
        if (bytes == 0) return '0 KB';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function formatDateTime(timeStr) {
        if (!timeStr || timeStr.length !== 14) return 'Data inválida';
        const year = timeStr.substring(0, 4);
        const month = timeStr.substring(4, 6);
        const day = timeStr.substring(6, 8);
        const hour = timeStr.substring(8, 10);
        const minute = timeStr.substring(10, 12);
        const second = timeStr.substring(12, 14);
        return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }

    function showToast(message, type = 'success') {
        // Sistema de notificações simples
        const toast = document.createElement('div');
        toast.className = `alert alert-${type} position-fixed top-0 end-0 m-3`;
        toast.style.zIndex = '9999';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    // --- Funções de API ---
    async function loadSystemInfo() {
        if (isLoading) return;
        isLoading = true;
        
        infoContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div><p>A carregar...</p></div>';
        
        try {
            const response = await fetch('/api/system/info');
            if (!response.ok) throw new Error('Falha ao carregar informações do sistema.');
            const result = await response.json();
            const data = result.data;

            const sdStatusMap = {
                'out': 'Nenhum Cartão',
                'Ready': 'Pronto',
                'Readonly': 'Apenas Leitura',
                'Full': 'Cheio'
            };

            const sdBadgeClass = {
                'Ready': 'success',
                'out': 'secondary',
                'Readonly': 'warning',
                'Full': 'danger'
            };

            let sdInfoHtml = '';
            if (data.sdstatus !== 'out' && data.sdtotalspace > 0) {
                const usedSpace = data.sdtotalspace - data.sdfreespace;
                const usedPercent = ((usedSpace / data.sdtotalspace) * 100).toFixed(1);
                sdInfoHtml = `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between mb-2">
                            <strong>Espaço SD:</strong>
                            <span>${formatBytes(data.sdfreespace)} livres de ${formatBytes(data.sdtotalspace)}</span>
                        </div>
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar ${usedPercent > 90 ? 'bg-danger' : usedPercent > 70 ? 'bg-warning' : 'bg-success'}" 
                                 role="progressbar" 
                                 style="width: ${usedPercent}%"
                                 aria-valuenow="${usedPercent}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                                ${usedPercent}% usado
                            </div>
                        </div>
                    </li>`;
            }

            infoContainer.innerHTML = `
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between">
                        <strong>Modelo:</strong> 
                        <span class="text-muted">${data.model || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <strong>Nome:</strong> 
                        <span class="text-muted">${data.name || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <strong>Versão Firmware:</strong> 
                        <span class="badge bg-info">${data.softVersion || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <strong>Versão Web:</strong> 
                        <span class="badge bg-info">${data.webVersion || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <strong>Uptime (Desde):</strong> 
                        <span class="text-muted">${data.startdate || 'N/A'}</span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between">
                        <strong>Cartão SD:</strong>
                        <span class="badge bg-${sdBadgeClass[data.sdstatus] || 'secondary'}">
                            ${sdStatusMap[data.sdstatus] || data.sdstatus}
                        </span>
                    </li>
                    ${sdInfoHtml}
                </ul>`;

            // Preenche Data/Hora
            const timeStr = data.time;
            document.getElementById('current-time').value = formatDateTime(timeStr);
            document.getElementById('timeZone').value = data.timeZone || 'Europe/Brussels';
            dstmodeCheckbox.checked = data.dstmode === 'on';
            const ntpEnabled = data.ntpenable === '1';
            ntpEnableCheckbox.checked = ntpEnabled;
            
            const cameraNtpServer = data.ntpserver;
            const serverExists = [...ntpServerSelect.options].some(opt => opt.value === cameraNtpServer);
            
            if (serverExists) {
                ntpServerSelect.value = cameraNtpServer;
                ntpServerOtherContainer.style.display = 'none';
            } else {
                ntpServerSelect.value = 'other';
                ntpServerOtherInput.value = cameraNtpServer || '';
                ntpServerOtherContainer.style.display = 'flex';
            }
            
            ntpIntervalSelect.value = data.ntpinterval || '24';
            toggleNtpSettings(ntpEnabled);

            // Preenche idioma
            if (data.lancode) {
                languageSelect.value = data.lancode;
            }

        } catch (error) {
            console.error('Erro:', error);
            infoContainer.innerHTML = `<div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> Erro ao carregar dados: ${error.message}
            </div>`;
        } finally {
            isLoading = false;
        }
    }

    async function syncWithPC() {
    if (!confirm('Sincronizar a hora da câmara com a hora atual deste computador?')) return;

    showLoadingState(syncPcBtn, true);

    const now = new Date();
    // Formato CORRETO conforme documentação: [yyyy].[mm].[dd].[hh].[mm].[ss]
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');
    
    const formattedTime = `${year}.${month}.${day}.${hour}.${minute}.${second}`;
    // Resultado: "2025.10.01.22.29.47"

    const params = {
        time: formattedTime,  // O backend vai adicionar o hífen automaticamente
        timeZone: document.getElementById('timeZone').value,
        dstmode: dstmodeCheckbox.checked ? 'on' : 'off'
    };

    try {
        const response = await fetch('/api/system/time', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ params: params })
        });
        const result = await response.json();
        
        if (result.status !== 'success') throw new Error(result.error);
        
        showToast('Hora sincronizada com sucesso!', 'success');
        setTimeout(() => loadSystemInfo(), 1000);
    } catch (error) {
        showToast(`Falha ao sincronizar: ${error.message}`, 'danger');
    } finally {
        showLoadingState(syncPcBtn, false);
    }
}

    async function saveTimeSettings() {
    showLoadingState(saveTimeBtn, true);

    let ntpServer = ntpServerSelect.value;
    if (ntpServer === 'other') {
        ntpServer = ntpServerOtherInput.value.trim();
        if (!ntpServer) {
            showToast('Por favor, insira um servidor NTP válido.', 'warning');
            showLoadingState(saveTimeBtn, false);
            return;
        }
    }

    const params = {
        timeZone: document.getElementById('timeZone').value,
        dstmode: dstmodeCheckbox.checked ? 'on' : 'off',
        ntpenable: ntpEnableCheckbox.checked ? '1' : '0',
        ntpserver: ntpServer,
        ntpinterval: ntpIntervalSelect.value
    };

    try {
        const response = await fetch('/api/system/time', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ params: params })
        });
        const result = await response.json();
        
        if (result.status !== 'success') throw new Error(result.error);
        
        showToast('Configurações de hora salvas com sucesso!', 'success');
        setTimeout(() => loadSystemInfo(), 1000);
    } catch (error) {
        showToast(`Falha ao salvar: ${error.message}`, 'danger');
    } finally {
        showLoadingState(saveTimeBtn, false);
    }
}

    async function saveLanguage() {
        showLoadingState(saveLanguageBtn, true);

        const params = { lancode: languageSelect.value };

        try {
            const response = await fetch('/api/language', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ params: params }),
            });

            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.error);
            
            showToast('Idioma salvo com sucesso!', 'success');
        } catch (error) {
            showToast(`Erro: ${error.message}`, 'danger');
        } finally {
            showLoadingState(saveLanguageBtn, false);
        }
    }

    async function performSystemAction(action, button) {
        let confirmation = true;
        let confirmMessage = '';
        
        if (action === 'reboot') {
            confirmMessage = 'Tem a certeza que deseja reiniciar a câmara? Esta ação irá interromper temporariamente o serviço.';
        } else if (action === 'reset') {
            confirmMessage = 'ATENÇÃO: Esta ação irá repor TODAS as configurações de fábrica da câmara. Todos os dados personalizados serão perdidos. Tem a certeza?';
        }
        
        if (action !== 'backup') {
            confirmation = confirm(confirmMessage);
        }
        
        if (!confirmation) return;

        showLoadingState(button, true);

        try {
            const response = await fetch('/api/system/actions', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ action: action })
            });
            const result = await response.json();
            
            if (result.status !== 'success') throw new Error(result.error);
            
            if (action === 'backup') {
                window.open(result.url, '_blank');
                showToast('Download do backup iniciado.', 'success');
            } else {
                const waitTime = action === 'reboot' ? 30 : 60;
                showToast(`Câmara a ${action === 'reboot' ? 'reiniciar' : 'resetar'}. A página irá recarregar em ${waitTime} segundos.`, 'warning');
                setTimeout(() => window.location.reload(), waitTime * 1000);
            }
        } catch (error) {
            showToast(`Falha ao executar: ${error.message}`, 'danger');
        } finally {
            if (action === 'backup') {
                showLoadingState(button, false);
            }
        }
    }

    async function performFileUpload(actionType, button) {
        const fileInput = document.getElementById(`${actionType}-file`);
        
        if (fileInput.files.length === 0) {
            showToast('Por favor, selecione um ficheiro primeiro.', 'warning');
            return;
        }

        const file = fileInput.files[0];
        const maxSize = 50 * 1024 * 1024; // 50MB
        
        if (file.size > maxSize) {
            showToast('O ficheiro é demasiado grande (máx. 50MB).', 'danger');
            return;
        }

        const confirmMsg = actionType === 'restore' 
            ? 'Tem a certeza que deseja restaurar as configurações? As configurações atuais serão substituídas.'
            : 'ATENÇÃO: Atualizar o firmware é uma operação crítica. Não desligue a câmara durante o processo. Continuar?';
            
        if (!confirm(confirmMsg)) return;

        showLoadingState(button, true);

        const formData = new FormData();
        formData.append('file', file);

        showToast('A enviar ficheiro... Por favor, aguarde e não desligue a câmara.', 'info');

        try {
            const response = await fetch(`/api/system/upload/${actionType}`, {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.status !== 'success') throw new Error(result.error);
            
            showToast('Operação concluída com sucesso! A câmara irá reiniciar.', 'success');
            setTimeout(() => window.location.reload(), 60000);
        } catch (error) {
            showToast(`Erro durante o upload: ${error.message}`, 'danger');
            showLoadingState(button, false);
        }
    }

    async function fetchLog(logType, displayElement, button) {
        if (button) showLoadingState(button, true);
        
        displayElement.value = 'A atualizar...';
        
        try {
            const response = await fetch(`/api/logs/${logType}`);
            if (!response.ok) throw new Error(`Falha ao obter o log.`);
            
            const logText = await response.text();
            displayElement.value = logText.trim() || 'Log vazio.';
            displayElement.scrollTop = displayElement.scrollHeight;
        } catch (error) {
            displayElement.value = `Erro: ${error.message}`;
            showToast(`Erro ao carregar log: ${error.message}`, 'danger');
        } finally {
            if (button) showLoadingState(button, false);
        }
    }

    async function clearSystemLog() {
        if (!confirm('Tem a certeza de que deseja limpar o log do sistema?')) return;
        
        showLoadingState(cleanSysLogBtn, true);
        sysLogDisplay.value = 'A limpar...';
        
        try {
            const response = await fetch('/api/logs/system/clear', { method: 'POST' });
            if (!response.ok) throw new Error('Falha ao limpar o log.');
            
            await response.json();
            showToast('Log limpo com sucesso.', 'success');
            await fetchLog('system', sysLogDisplay);
        } catch (error) {
            sysLogDisplay.value = `Erro: ${error.message}`;
            showToast(`Erro ao limpar log: ${error.message}`, 'danger');
        } finally {
            showLoadingState(cleanSysLogBtn, false);
        }
    }

    function toggleNtpSettings(isEnabled) {
        ntpSettingsDiv.style.display = isEnabled ? 'block' : 'none';
    }

    // --- Event Listeners ---
    rebootBtn.addEventListener('click', () => performSystemAction('reboot', rebootBtn));
    resetBtn.addEventListener('click', () => performSystemAction('reset', resetBtn));
    backupBtn.addEventListener('click', () => performSystemAction('backup', backupBtn));
    restoreBtn.addEventListener('click', () => performFileUpload('restore', restoreBtn));
    upgradeBtn.addEventListener('click', () => performFileUpload('upgrade', upgradeBtn));
    
    saveTimeBtn.addEventListener('click', saveTimeSettings);
    syncPcBtn.addEventListener('click', syncWithPC);
    ntpEnableCheckbox.addEventListener('change', (e) => toggleNtpSettings(e.target.checked));
    ntpServerSelect.addEventListener('change', () => {
        ntpServerOtherContainer.style.display = (ntpServerSelect.value === 'other') ? 'flex' : 'none';
    });

    saveLanguageBtn.addEventListener('click', saveLanguage);
    
    refreshSysLogBtn.addEventListener('click', () => fetchLog('system', sysLogDisplay, refreshSysLogBtn));
    cleanSysLogBtn.addEventListener('click', clearSystemLog);
    refreshProcLogBtn.addEventListener('click', () => fetchLog('process', procLogDisplay, refreshProcLogBtn));

    // --- Carregamento Inicial ---
    loadSystemInfo();
    fetchLog('system', sysLogDisplay);
    fetchLog('process', procLogDisplay);
});