// app/static/js/audio_manager.js
import { renderAudioPage } from './audio_settings.js';

window.app_context = {
    cameraSettingsCache: { audio: {} },
    // O commandSetToGetMap mapeia o comando SET ao seu GET correspondente para a lógica de cache
    commandSetToGetMap: {
        'setaudioflag': 'getaudioflag',
        'setaencattr': 'getaencattr', // Mapeamento base
        'setaudioinvolume': 'getaudioinvolume',
        'setaudiooutvolume': 'getaudiooutvolume',
        'setaudioalarmattr': 'getaudioalarmattr',
        'setalarmsoundattr': 'getalarmsoundattr',
        'setmdalarm': 'getmdalarm'
    },
    showNotification: function(type, message) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.className = `notification show ${type}`;
        notification.textContent = message;
        setTimeout(() => { notification.classList.remove('show'); }, 3000);
    }
};

/**
 * Anexa os handlers de submissão a todos os formulários da página.
 */
function attachSaveHandlers() {
    const forms = document.querySelectorAll('#audio-settings-container form');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const button = e.submitter; // O botão que foi clicado para submeter
            const setCommand = form.getAttribute('data-set-cmd') || button.getAttribute('data-set-cmd');
            if (!setCommand) return;

            // Lógica para obter o comando 'get' correto para o cache
            let getCommandKey = window.app_context.commandSetToGetMap[setCommand.split('&')[0]];
            
            const formData = new FormData(form);
            const paramsFromForm = Object.fromEntries(formData.entries());

            // Caso especial para setaencattr, que precisa do parâmetro 'chn'
            if (setCommand === 'setaencattr' && button.dataset.chn) {
                paramsFromForm.chn = button.dataset.chn;
                getCommandKey += `&-chn=${button.dataset.chn}`;
            }

            const originalParams = window.app_context.cameraSettingsCache.audio[getCommandKey] || {};
            const paramsToSend = Object.assign({}, originalParams, paramsFromForm);
            
            window.app_context.showNotification('processando', 'A salvar...');
            
            try {
                const response = await fetch(`/api/params/set/${setCommand}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ params: paramsToSend })
                });
                const result = await response.json();
                if (result.status !== 'success') throw new Error(result.error);
                
                window.app_context.showNotification('success', 'Alterações salvas!');
                Object.assign(window.app_context.cameraSettingsCache.audio[getCommandKey], paramsFromForm);

            } catch (error) {
                window.app_context.showNotification('error', `Falha ao salvar: ${error.message}`);
            }
        });
    });

    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        input.addEventListener('input', function() {
            const span = this.nextElementSibling;
            if (span && span.tagName === 'SPAN') {
                span.textContent = this.value;
            }
        });
    });
}

/**
 * Função principal que carrega os dados e inicializa a página de áudio.
 */
async function loadAudioPage() {
    const commands = [
        'getaudioflag', 'getaencattr&-chn=11', 'getaencattr&-chn=12',
        'getaudioinvolume', 'getaudiooutvolume', 'getaudioalarmattr', 
        'getalarmsoundattr', 'getmdalarm&-aname=sound'
    ];
    const container = document.getElementById('audio-settings-container');

    try {
        const promises = commands.map(async (cmd) => {
            const encodedCommand = encodeURIComponent(cmd);
            const response = await fetch(`/api/params/get/${encodedCommand}`);
            const result = await response.json();
            if (result.status === 'failed') throw new Error(result.error);
            window.app_context.cameraSettingsCache.audio[cmd] = result.data;
            return result.data;
        });

        const results = await Promise.all(promises);
        const allParams = Object.assign({}, ...results);

        container.innerHTML = renderAudioPage(allParams);
        attachSaveHandlers();
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Falha ao carregar dados: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadAudioPage);