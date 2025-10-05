// app/static/js/network_manager.js
import { renderNetworkTab, attachNetworkTabListeners } from './network_settings.js';

// Define o contexto global, principalmente para a função de notificação
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
 * Anexa o handler de submissão ao formulário de rede.
 */
function attachSaveHandler() {
    const form = document.getElementById('form-network-all');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const params = Object.fromEntries(formData.entries());

        window.app_context.showNotification('processando', 'A salvar configurações de rede...');
        
        try {
            const response = await fetch('/api/network/set_all', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ params: params })
            });
            const result = await response.json();
            if (result.status !== 'success') throw new Error(result.error);
            
            window.app_context.showNotification('success', 'Configurações salvas! A câmara pode reiniciar.');
            setTimeout(() => window.location.reload(), 3000); 
        } catch (error) {
            window.app_context.showNotification('error', `Falha ao salvar: ${error.message}`);
        }
    });
}

/**
 * Função principal que carrega os dados e inicializa a página de rede.
 */
async function loadNetworkPage() {
    const commands = [
        'getnetattr', 'gethttpport', 'getrtspport', 
        'getrtspauth', 'getupnpattr', 'getonvifattr'
    ];
    const container = document.getElementById('network-settings-container');

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

        container.innerHTML = renderNetworkTab(allParams);
        attachNetworkTabListeners();
        attachSaveHandler();

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Falha ao carregar dados: ${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadNetworkPage);