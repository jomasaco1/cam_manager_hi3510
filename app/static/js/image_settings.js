// app/static/js/image_settings.js

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

async function saveFormChanges(form) {
    const tabId = form.closest('.tab-pane')?.id.replace('tab-', '');
    if (!tabId) return;

    const setCommand = form.getAttribute('data-set-cmd');
    if (!setCommand) return;

    const notification = document.getElementById('notification');
    notification.className = `notification show processando`;
    notification.textContent = 'A aplicar alterações...';

    const { commandSetToGetMap, cameraSettingsCache, showNotification } = window.app_context;

    const getCommandBase = Object.keys(commandSetToGetMap).find(key => setCommand.startsWith(key));
    const originalGetCommand = commandSetToGetMap[getCommandBase];

    if (!originalGetCommand || !cameraSettingsCache[tabId] || !cameraSettingsCache[tabId][originalGetCommand]) {
        showNotification('error', `Cache para '${originalGetCommand}' não encontrado.`);
        return;
    }

    const formData = new FormData(form);
    const paramsFromForm = Object.fromEntries(formData.entries());
    const originalParams = cameraSettingsCache[tabId][originalGetCommand];
    const paramsToSend = Object.assign({}, originalParams, paramsFromForm);

    try {
        const response = await fetch(`/api/params/set/${setCommand}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ params: paramsToSend })
        });
        const result = await response.json();

        if (result.status === 'success') {
            showNotification('success', 'Alterações aplicadas!');
            Object.assign(cameraSettingsCache[tabId][originalGetCommand], paramsFromForm);
            // A imagem já não é um snapshot, é um vídeo, por isso não precisa de ser recarregada
        } else { throw new Error(result.error); }
    } catch (error) {
        showNotification('error', `Falha ao aplicar: ${error.message}`);
    }
}

export function initializeImageTabPlayer() {
    try {
        const canvas = document.getElementById("video_cavas_image");
        if (!canvas) {
            console.error("Canvas para o player de imagem não encontrado.");
            return;
        }

        const w = parseInt(width_2) || 640;
        const h = parseInt(height_2) || 352;
        canvas.width = w;
        canvas.height = h;

        const player = new HxPlayer();
        player.init({ canvas: canvas, width: w, height: h });
        
        player.playvideo(cam_config.ip, cam_config.port, cam_config.stream_type, cam_config.user, cam_config.pass);
    } catch (e) {
        console.error("Erro ao inicializar o HxPlayer na aba de imagem:", e);
        const canvas = document.getElementById("video_cavas_image");
        if(canvas){
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            ctx.fillText("Erro ao carregar o vídeo.", canvas.width / 2, canvas.height / 2);
        }
    }
}

export function renderImageTab(params) {
    const html = `
    <div class="settings-container">
        <div class="form-column">
            <form id="form-image" class="form-section" data-set-cmd="setimageattr">
                <h3>Ajustes de Imagem</h3>
                <div class="form-group range-group"><label title="Controla o brilho geral da imagem (0–100)">Brilho</label><input type="range" name="brightness" min="0" max="100" value="${params.brightness || 50}" class="live-update"><span>${params.brightness || 50}</span></div>
                <div class="form-group range-group"><label title="Controla a intensidade das cores (0-255)">Saturação</label><input type="range" name="saturation" min="0" max="255" value="${params.saturation || 106}" class="live-update"><span>${params.saturation || 106}</span></div>
                <div class="form-group range-group"><label title="Diferença entre as áreas claras e escuras (0–100)">Contraste</label><input type="range" name="contrast" min="0" max="100" value="${params.contrast || 50}" class="live-update"><span>${params.contrast || 50}</span></div>
                <div class="form-group range-group"><label title="Ajusta a nitidez dos contornos (0–100)">Nitidez</label><input type="range" name="sharpness" min="0" max="100" value="${params.sharpness || 65}" class="live-update"><span>${params.sharpness || 65}</span></div>
                <hr>
                <div class="form-group"><label title="Wide Dynamic Range">WDR</label><select name="wdr" class="live-update"><option value="on" ${params.wdr === 'on' ? 'selected' : ''}>Ligado</option><option value="off" ${params.wdr === 'off' ? 'selected' : ''}>Desligado</option></select></div>
                <div class="form-group range-group"><label title="Intensidade do efeito WDR (1–30)">Nível WDR</label><input type="range" name="wdrvalue" min="1" max="30" value="${params.wdrvalue || 15}" class="live-update"><span>${params.wdrvalue || 15}</span></div>
                <hr>
                <div class="form-group"><label title="Inverte a imagem verticalmente">Flip Vertical</label><select name="flip" class="live-update"><option value="on" ${params.flip === 'on' ? 'selected' : ''}>Ligado</option><option value="off" ${params.flip === 'off' ? 'selected' : ''}>Desligado</option></select></div>
                <div class="form-group"><label title="Inverte a imagem horizontalmente">Espelho (Mirror)</label><select name="mirror" class="live-update"><option value="on" ${params.mirror === 'on' ? 'selected' : ''}>Ligado</option><option value="off" ${params.mirror === 'off' ? 'selected' : ''}>Desligado</option></select></div>
            </form>
            <form id="form-ldc" class="form-section" data-set-cmd="setldcattr">
                 <h3>Correção de Distorção da Lente</h3>
                 <div class="form-group"><label title="Ativa a correção de distorção.">Correção LDC</label><select name="ldc_enable" class="live-update"><option value="1" ${params.ldc_enable === '1' ? 'selected' : ''}>Ligado</option><option value="0" ${params.ldc_enable === '0' ? 'selected' : ''}>Desligado</option></select></div>
                 <div class="form-group range-group"><label title="Intensidade da correção (0-511)">Rácio LDC</label><input type="range" name="ldc_ratio" min="0" max="511" value="${params.ldc_ratio || 0}" class="live-update"><span>${params.ldc_ratio || 0}</span></div>
            </form>
        </div>
        <div class="snapshot-column">
            <h3>Pré-visualização ao Vivo</h3>
            <div class="snapshot-container">
                <canvas id="video_cavas_image"></canvas>
            </div>
            <div class="info-section"><h4>Informação do Sensor</h4><p><strong>Resolução Máxima:</strong> ${params.imagesize || 'N/A'}</p></div>
        </div>
    </div>`;

    const debouncedSave = debounce(saveFormChanges, 300);

    setTimeout(() => {
        const liveUpdateControls = document.querySelectorAll('.live-update');
        liveUpdateControls.forEach(control => {
            const eventType = control.type === 'range' ? 'input' : 'change';
            control.addEventListener(eventType, (e) => {
                const form = e.target.closest('form');
                if (e.target.type === 'range') {
                    const span = e.target.nextElementSibling;
                    if (span && span.tagName === 'SPAN') {
                        span.textContent = e.target.value;
                    }
                }
                if (form) {
                    debouncedSave(form);
                }
            });
        });
    }, 0);

    return html;
}