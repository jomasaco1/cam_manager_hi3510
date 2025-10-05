// app/static/js/osd_manager.js
import { renderOsdPage } from './osd_settings.js';

window.app_context = {
    cameraSettingsCache: { osd: {} },
    showNotification: function(type, message) {
        const notification = document.getElementById('notification');
        if (!notification) return;
        notification.className = `notification show ${type}`;
        notification.textContent = message;
        setTimeout(() => { notification.classList.remove('show'); }, 3000);
    }
};

let cameraResolution = { width: 2560, height: 1920 };

async function loadOsdPage() {
    const commands = [
        'getoverlayattr&-region=0', 'getoverlayattr&-region=1', 
        'getcover', 'getvencattr&-chn=11'
    ];
    const container = document.getElementById('osd-settings-container');
    container.innerHTML = '<div class="loader">A carregar...</div>';

    try {
        const promises = commands.map(async (cmd) => {
            const encodedCommand = encodeURIComponent(cmd);
            const response = await fetch(`/api/params/get/${encodedCommand}`);
            const result = await response.json();
            if (result.status === 'failed') {
                console.warn(`Falha no comando ${cmd}: ${result.error}`);
                return {};
            }
            window.app_context.cameraSettingsCache.osd[cmd] = result.data;
            return result.data;
        });

        const results = await Promise.all(promises);
        const allParams = Object.assign({}, ...results);

        cameraResolution.width = parseInt(allParams.width_1) || 2560;
        cameraResolution.height = parseInt(allParams.height_1) || 1920;

        container.innerHTML = renderOsdPage(allParams);
        attachAllListeners();
    } catch (error) {
        container.innerHTML = `<p style="color: red;">Falha ao carregar dados: ${error.message}</p>`;
    }
}

function attachAllListeners() {
    const formOsd = document.getElementById('form-osd');
    const formCovers = document.getElementById('form-covers');
    
    if (formOsd) formOsd.addEventListener('input', updatePreview);
    if (formCovers) {
        formCovers.addEventListener('input', (e) => {
            if (e.target.type === 'number' || e.target.type === 'text') {
                const region = e.target.name.split('_')[1];
                clampCoverValues(region);
            }
            updatePreview();
        });
    }
    
    if (formOsd) formOsd.addEventListener('submit', handleSaveOsd);
    if (formCovers) formCovers.addEventListener('submit', handleSaveCovers);

    initInteractiveMasks();
    
    const snapshotBg = document.getElementById('snapshot-bg');
    if (snapshotBg) {
        snapshotBg.complete ? updatePreview() : snapshotBg.addEventListener('load', updatePreview);
    }
}

function clampCoverValues(region) {
    const x_input = document.querySelector(`[name="x_${region}"]`);
    const y_input = document.querySelector(`[name="y_${region}"]`);
    const w_input = document.querySelector(`[name="w_${region}"]`);
    const h_input = document.querySelector(`[name="h_${region}"]`);
    if (!x_input || !y_input || !w_input || !h_input) return;

    x_input.value = Math.max(0, parseInt(x_input.value || 0));
    y_input.value = Math.max(0, parseInt(y_input.value || 0));
    w_input.value = Math.max(0, parseInt(w_input.value || 0));
    h_input.value = Math.max(0, parseInt(h_input.value || 0));

    x_input.value = Math.min(x_input.value, cameraResolution.width - 1);
    y_input.value = Math.min(y_input.value, cameraResolution.height - 1);

    if ((parseInt(x_input.value) + parseInt(w_input.value)) > cameraResolution.width) {
        w_input.value = cameraResolution.width - parseInt(x_input.value);
    }
    if ((parseInt(y_input.value) + parseInt(h_input.value)) > cameraResolution.height) {
        h_input.value = cameraResolution.height - parseInt(y_input.value);
    }
}

function updatePreview() {
    const snapshot = document.getElementById('snapshot-bg');
    if (!snapshot || !snapshot.complete || snapshot.naturalWidth === 0) return;
    const scale = snapshot.offsetWidth / cameraResolution.width;

    // Atualiza OSD
    for (let i = 0; i < 2; i++) {
        const osd = document.getElementById(`preview-osd-${i}`);
        const showInput = document.querySelector(`[name="show_${i}"]`);
        const placeInput = document.querySelector(`[name="place_${i}"]`);
        const textInput = document.querySelector(`[name="name_${i}"]`);
        if (!osd || !showInput || !placeInput) continue;

        const show = showInput.value === '1';
        const place = placeInput.value;
        const text = (i === 0) ? new Date().toLocaleString() : (textInput ? textInput.value : '');
        
        osd.style.display = show ? 'block' : 'none';
        osd.textContent = text;
        osd.className = 'osd-preview-text ' + ['top-left', 'top-right', 'bottom-left', 'bottom-right'][place];
    }
    
    // Atualiza Máscaras
    for (let i = 1; i <= 4; i++) {
        const cover = document.getElementById(`preview-cover-${i}`);
        const showCheckbox = document.getElementById(`show_${i}`);
        if (!cover || !showCheckbox) continue;

        if (showCheckbox.checked) {
            cover.style.display = 'block';
            cover.style.backgroundColor = document.querySelector(`[name="color_${i}"]`).value;
            cover.style.left = (parseInt(document.querySelector(`[name="x_${i}"]`).value) * scale) + 'px';
            cover.style.top = (parseInt(document.querySelector(`[name="y_${i}"]`).value) * scale) + 'px';
            cover.style.width = (parseInt(document.querySelector(`[name="w_${i}"]`).value) * scale) + 'px';
            cover.style.height = (parseInt(document.querySelector(`[name="h_${i}"]`).value) * scale) + 'px';
        } else {
            cover.style.display = 'none';
        }
    }
}

async function handleSaveOsd(e) {
    e.preventDefault();
    const form = e.target;
    const originalParamsR0 = window.app_context.cameraSettingsCache.osd['getoverlayattr&-region=0'] || {};
    const originalParamsR1 = window.app_context.cameraSettingsCache.osd['getoverlayattr&-region=1'] || {};

    const paramsR0 = { ...originalParamsR0, show: form.querySelector('[name="show_0"]').value, place: form.querySelector('[name="place_0"]').value };
    const paramsR1 = { ...originalParamsR1, show: form.querySelector('[name="show_1"]').value, place: form.querySelector('[name="place_1"]').value, name: form.querySelector('[name="name_1"]').value };

    window.app_context.showNotification('processando', 'A salvar OSD...');
    
    try {
        const response = await fetch('/api/osd/set_all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { region0: paramsR0, region1: paramsR1 } })
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.error);
        window.app_context.showNotification('success', 'Configurações de OSD salvas!');
    } catch (error) {
        window.app_context.showNotification('error', `Falha ao salvar OSD: ${error.message}`);
    }
}

async function handleSaveCovers(e) {
    e.preventDefault();
    const form = e.target; // O formulário que foi submetido
    const params = {};
    for (let i = 1; i <= 4; i++) {
        // CORREÇÃO: Usar 'form.querySelector' em vez de 'e.target.querySelector'
        params[`show_${i}`] = form.querySelector(`[name="show_${i}"]`).checked ? '1' : '0';
        params[`color_${i}`] = form.querySelector(`[name="color_${i}"]`).value;
        params[`x_${i}`] = form.querySelector(`[name="x_${i}"]`).value;
        params[`y_${i}`] = form.querySelector(`[name="y_${i}"]`).value;
        params[`w_${i}`] = form.querySelector(`[name="w_${i}"]`).value;
        params[`h_${i}`] = form.querySelector(`[name="h_${i}"]`).value;
    }
    
    window.app_context.showNotification('processando', 'A salvar máscaras...');

    try {
        const response = await fetch('/api/covers/set_all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: params })
        });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.error);
        window.app_context.showNotification('success', 'Máscaras de privacidade salvas!');
    } catch (error) {
        window.app_context.showNotification('error', `Falha ao salvar máscaras: ${error.message}`);
    }
}

function initInteractiveMasks() {
    const previewContainer = document.getElementById('preview-container');
    if (!previewContainer) return;

    for (let i = 1; i <= 4; i++) {
        const mask = document.getElementById(`preview-cover-${i}`);
        if (!mask) continue;
        
        const handle = mask.querySelector('.resize-handle');
        if (!handle) continue;

        let isDragging = false, isResizing = false;
        let startX, startY, startLeft, startTop, startWidth, startHeight;

        const updateInputsFromPreview = (region) => {
            const scale = document.getElementById('snapshot-bg').offsetWidth / cameraResolution.width;
            if (scale === 0) return;
            document.querySelector(`[name="x_${region}"]`).value = Math.round(mask.offsetLeft / scale);
            document.querySelector(`[name="y_${region}"]`).value = Math.round(mask.offsetTop / scale);
            document.querySelector(`[name="w_${region}"]`).value = Math.round(mask.offsetWidth / scale);
            document.querySelector(`[name="h_${region}"]`).value = Math.round(mask.offsetHeight / scale);
        };

        mask.addEventListener('mousedown', (e) => {
            if (e.target !== handle) {
                isDragging = true;
                startX = e.clientX; startY = e.clientY;
                startLeft = mask.offsetLeft; startTop = mask.offsetTop;
                previewContainer.style.cursor = 'move';
            }
        });

        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isResizing = true;
            startX = e.clientX; startY = e.clientY;
            startWidth = mask.offsetWidth; startHeight = mask.offsetHeight;
            previewContainer.style.cursor = 'se-resize';
        });

        previewContainer.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dx = e.clientX - startX; const dy = e.clientY - startY;
                mask.style.left = `${startLeft + dx}px`;
                mask.style.top = `${startTop + dy}px`;
                updateInputsFromPreview(i);
            }
            if (isResizing) {
                const dw = e.clientX - startX; const dh = e.clientY - startY;
                mask.style.width = `${startWidth + dw}px`;
                mask.style.height = `${startHeight + dh}px`;
                updateInputsFromPreview(i);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging || isResizing) {
                clampCoverValues(i);
                updatePreview();
            }
            isDragging = false; isResizing = false;
            previewContainer.style.cursor = 'default';
        });
    }
}

document.addEventListener('DOMContentLoaded', loadOsdPage);