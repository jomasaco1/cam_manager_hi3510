// app/static/js/ptz_manager.js
document.addEventListener('DOMContentLoaded', () => {
    // Seletores dos elementos
    const ptzButtons = document.querySelectorAll('.ptz-btn');
    const gotoPresetBtn = document.getElementById('goto-preset');
    const setPresetBtn = document.getElementById('set-preset');
    const deletePresetBtn = document.getElementById('delete-preset');
    const presetNumberInput = document.getElementById('preset-number');
    const speedSlider = document.getElementById('ptz-speed');
    const speedValueSpan = document.getElementById('speed-value');
	const hscanBtn = document.getElementById('hscan-btn');
    const vscanBtn = document.getElementById('vscan-btn');
    const stopScanBtn = document.getElementById('stopscan-btn');
	// Seletores para o novo formulário de rastreamento
    const trackingForm = document.getElementById('tracking-form');
    const enableTrackingCheckbox = document.getElementById('smartrack_enable');
    const timeoutInput = document.getElementById('smartrack_timeout');
    const alarmPresetInput = document.getElementById('alarmpresetindex');
    const watchPresetInput = document.getElementById('watchpresetindex');

    // Função para enviar um comando de movimento PTZ para a nossa API
    const sendPtzCommand = async (action) => {
        const speed = speedSlider.value; // Obtém o valor atual do slider
        try {
            await fetch('/api/ptz/control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action, speed: speed })
            });
        } catch (error) {
            console.error(`Erro ao enviar comando PTZ '${action}':`, error);
        }
    };

    // Função para gerir presets (ir, definir, eliminar)
    const handlePreset = async (action) => {
        const number = presetNumberInput.value;
        if (!number) {
            console.error('Número do preset não inserido.');
            return;
        }

        let params = { action: action, number: number };
        
        // O comando para ELIMINAR na câmara é 'set' com 'status=0'
        if (action === 'delete') {
            params.action = 'set';
            params.status = '0'; // Status 0 para limpar/eliminar
        }

        try {
            await fetch('/api/ptz/preset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });
            console.log(`Ação de preset '${action}' para o número '${number}' enviada.`);
        } catch (error) {
            console.error(`Erro na ação de preset '${action}':`, error);
        }
    };
	
	// Função para carregar as configurações atuais de rastreamento da câmara
    const loadTrackingSettings = async () => {
        try {
            // Busca os parâmetros de rastreamento
            let response = await fetch('/api/params/get/getsmartrackattr');
            let result = await response.json();
            if (result.status === 'success') {
                enableTrackingCheckbox.checked = (result.data.smartrack_enable === '1');
                timeoutInput.value = result.data.smartrack_timeout;
            }

            // Busca os parâmetros de motor (que contêm os presets)
            response = await fetch('/api/params/get/getmotorattr');
            result = await response.json();
            if (result.status === 'success') {
                alarmPresetInput.value = result.data.alarmpresetindex;
                watchPresetInput.value = result.data.watchpresetindex;
            }
        } catch (error) {
            console.error("Erro ao carregar configurações de rastreamento:", error);
        }
    };

    // Função para salvar as configurações de rastreamento
    const saveTrackingSettings = async (event) => {
        event.preventDefault(); // Impede o envio tradicional do formulário
        
        const settings = {
            smartrack_enable: enableTrackingCheckbox.checked ? '1' : '0',
            smartrack_timeout: timeoutInput.value,
            alarmpresetindex: alarmPresetInput.value,
            watchpresetindex: watchPresetInput.value
        };

        try {
            const response = await fetch('/api/ptz/tracking_settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            const result = await response.json();
            if (result.status === 'success') {
                alert('Configurações de rastreamento salvas com sucesso!');
            } else {
                throw new Error(result.error1 || result.error2 || 'Erro desconhecido');
            }
        } catch (error) {
            alert(`Falha ao salvar configurações: ${error.message}`);
        }
    };
    
    // Adicionar eventos aos botões de movimento
    ptzButtons.forEach(button => {
        const action = button.dataset.action;
        button.addEventListener('mousedown', () => sendPtzCommand(action));
        button.addEventListener('mouseup', () => {
            if (action !== 'home') {
                sendPtzCommand('stop');
            }
        });
        button.addEventListener('touchstart', (e) => { e.preventDefault(); sendPtzCommand(action); });
        button.addEventListener('touchend', () => {
            if (action !== 'home') {
                sendPtzCommand('stop');
            }
        });
    });

    // Adicionar eventos aos botões de preset
    gotoPresetBtn.addEventListener('click', () => handlePreset('goto'));
    setPresetBtn.addEventListener('click', () => handlePreset('set'));
    deletePresetBtn.addEventListener('click', () => handlePreset('delete'));

    // Atualizar o valor da velocidade exibido ao mover o slider
    speedSlider.addEventListener('input', () => {
        speedValueSpan.textContent = speedSlider.value;
    });
	 hscanBtn.addEventListener('click', () => {
        sendPtzCommand('hscan');
    });
    vscanBtn.addEventListener('click', () => {
        sendPtzCommand('vscan');
    });
    stopScanBtn.addEventListener('click', () => {
        sendPtzCommand('stop');
    });
	trackingForm.addEventListener('submit', saveTrackingSettings);

    // Carregar as configurações iniciais de rastreamento quando a página é carregada
    loadTrackingSettings();
});