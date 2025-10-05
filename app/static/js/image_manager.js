// app/static/js/image_manager.js
import { renderImageTab, initializeImageTabPlayer } from './image_settings.js';

// Define as funções e variáveis que os módulos podem precisar
window.app_context = {
    showNotification: function(type, message) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.className = `notification show ${type}`;
        notification.textContent = message;
        setTimeout(() => { notification.classList.remove('show'); }, 3000);
    },
    cameraSettingsCache: { image: {} }, // Cache local para esta página
    commandSetToGetMap: {
        'setimageattr': 'getimageattr',
        'setldcattr': 'getldcattr',
    }
};

// Função para buscar os dados necessários para esta página
async function loadImageData() {
    const commands = ['getimageattr', 'getldcattr', 'getimagemaxsize'];
    const container = document.getElementById('image-settings-container');

    try {
        const promises = commands.map(async (cmd) => {
            const encodedCommand = encodeURIComponent(cmd);
            const response = await fetch(`/api/params/get/${encodedCommand}`);
            const result = await response.json();
            if (result.status === 'failed') throw new Error(result.error);
            // Guarda no cache
            window.app_context.cameraSettingsCache.image[cmd] = result.data;
            return result.data;
        });

        const results = await Promise.all(promises);
        const allParams = Object.assign({}, ...results);

        // Renderiza o HTML e inicializa o player
        container.innerHTML = renderImageTab(allParams);
        initializeImageTabPlayer();

    } catch (error) {
        container.innerHTML = `<p style="color: red;">Falha ao carregar dados: ${error.message}</p>`;
    }
}

// Inicia o processo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadImageData);