// app/static/js/video_manager.js
import { renderVideoTab, initializeVideoTabPlayer, handleResolutionChange, calculateVideoMode } from './video_settings.js';

// Define as funções e variáveis que os módulos podem precisar
window.app_context = {
    showNotification: function(type, message) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.className = `notification show ${type}`;
        notification.textContent = message;
        setTimeout(() => { notification.classList.remove('show'); }, 3000);
    }
};

/**
 * Anexa o handler de submissão ao formulário de vídeo.
 * @param {object} params - Os parâmetros originais da câmara, para preencher campos em falta.
 */
function attachSaveHandler(params) {
    const form = document.getElementById('form-video-all');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const paramsFromForm = Object.fromEntries(formData.entries());

        paramsFromForm.videomode = calculateVideoMode();
        
        // Adiciona parâmetros que não estão no formulário (GOP, etc.) a partir dos dados originais
        paramsFromForm.gop_1 = params.gop_1 || '60';
        paramsFromForm.brmode_1 = params.brmode_1 || '1';
        paramsFromForm.imagegrade_1 = params.imagegrade_1 || '1';
        paramsFromForm.gop_2 = params.gop_2 || '60';
        paramsFromForm.brmode_2 = params.brmode_2 || '1';
        paramsFromForm.imagegrade_2 = params.imagegrade_2 || '1';

        window.app_context.showNotification('processando', 'A salvar configurações de vídeo...');
        
        try {
            const response = await fetch('/api/video/set_all', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ params: paramsFromForm })
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.error);
            
            window.app_context.showNotification('success', 'Configurações salvas! A página será recarregada para aplicar as alterações.');
            setTimeout(() => window.location.reload(), 2000); 
        } catch (error) {
            window.app_context.showNotification('error', `Falha ao salvar: ${error.message}`);
        }
    });

    // Anexa listeners para a lógica de UI
    document.getElementById('form_size1max').addEventListener('change', handleResolutionChange);
    handleResolutionChange(); // Executa uma vez para o estado inicial

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
 * Função principal que carrega os dados e inicializa a página de vídeo.
 */
async function loadVideoPage() {
    const commands = [
        'getvideoattr', 'getstreamnum', 'getmobilesnapattr',
        'getvencattr&-chn=11', 'getvencattr&-chn=12'
    ];
    const container = document.getElementById('video-settings-container');

    try {
        const promises = commands.map(async (cmd) => {
            const encodedCommand = encodeURIComponent(cmd);
            const response = await fetch(`/api/params/get/${encodedCommand}`);
            return await response.json();
        });

        const results = await Promise.all(promises);
        let allParams = {};
        results.forEach(result => {
            if (result.status === 'failed') throw new Error(result.error);
            Object.assign(allParams, result.data);
        });

        container.innerHTML = renderVideoTab(allParams);
        initializeVideoTabPlayer();
        attachSaveHandler(allParams); // Passa os parâmetros para o handler

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Falha ao carregar dados: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadVideoPage);