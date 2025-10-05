// app/static/js/video_settings.js

// A função de inicialização do player permanece a mesma
export function initializeVideoTabPlayer() {
    try {
        const canvas = document.getElementById("video_canvas_video");
        if (!canvas) { return; }
        const w = parseInt(width_2) || 640;
        const h = parseInt(height_2) || 352;
        canvas.width = w;
        canvas.height = h;
        const player = new HxPlayer();
        player.init({ canvas: canvas, width: w, height: h });
        player.playvideo(cam_config.ip, cam_config.port, cam_config.stream_type, cam_config.user, cam_config.pass);
    } catch (e) {
        console.error("Erro ao inicializar o HxPlayer na aba de vídeo:", e);
    }
}

/**
 * Lógica para gerir a visibilidade dos menus de resolução.
 * EXPORTADA para ser usada pelo settings_manager.js
 */
export function handleResolutionChange() {
    const f1max = document.getElementById("form_size1max");
    const size2max_tr = document.getElementById('size2max_tr');
    const size2min_tr = document.getElementById('size2min_tr');

    if (!f1max || !size2max_tr || !size2min_tr) return;

    // Lógica simplificada baseada no original
    if (f1max.selectedIndex <= 1) { // 2560x...
        size2min_tr.style.display = "none";
        size2max_tr.style.display = "";
    } else { // 2304x... ou 1920x...
        size2min_tr.style.display = "";
        size2max_tr.style.display = "none";
    }
}

/**
 * Calcula o valor do 'videomode' com base nas seleções dos menus.
 * EXPORTADA para ser usada pelo settings_manager.js
 * @returns {number} O código do videomode.
 */
export function calculateVideoMode() {
    const f1max = document.getElementById("form_size1max");
    const f2max = document.getElementById("form_size2max");
    const f2min = document.getElementById("form_size2min");

    const a = f1max.selectedIndex;
    const c = f2max.selectedIndex;
    const d = f2min.selectedIndex;
    let v = 0;

    // Lógica replicada do video.js original
    if (a <= 1) { // Main Stream de alta resolução
        v = (c === 0) ? 101 : 102;
    } else { // Main Stream de resolução mais baixa
        v = (d === 0) ? 81 : 82;
    }
    return v;
}

export function renderVideoTab(params) {
    return `
    <div class="settings-container">
        <div class="form-column">
            <form id="form-video-all" class="form-section">
                <h3>Configurações Gerais de Vídeo</h3>
                <div class="form-group">
                    <label>Norma de Vídeo</label>
                    <select id="form_vinorm" name="vinorm">
                        <option value="P" ${params.vinorm === 'P' ? 'selected' : ''}>50Hz (PAL)</option>
                        <option value="N" ${params.vinorm === 'N' ? 'selected' : ''}>60Hz (NTSC)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Perfil de Codificação</label>
                    <select id="form_profile" name="profile">
                        <option value="0" ${params.profile === '0' ? 'selected' : ''}>H264 Baseline</option>
                        <option value="1" ${params.profile === '1' ? 'selected' : ''}>H264 Main</option>
                        <option value="2" ${params.profile === '2' ? 'selected' : ''}>H264 High</option>
                        <option value="3" ${params.profile === '3' ? 'selected' : ''}>H265 Main</option>
                    </select>
                </div>

                <hr>
                <h3>Stream Principal</h3>
                <div class="form-group">
                    <label>Resolução</label>
                    <select id="form_size1max" name="resolution_main">
                        <option value="2560x1920" ${params.height_1 === '1920' ? 'selected' : ''}>2560x1920</option>
                        <option value="2560x1440" ${params.height_1 === '1440' ? 'selected' : ''}>2560x1440</option>
                        <option value="2304x1296" ${params.height_1 === '1296' ? 'selected' : ''}>2304x1296</option>
                        <option value="1920x1080" ${params.height_1 === '1080' ? 'selected' : ''}>1920x1080</option>
                    </select>
                </div>
                <div class="form-group range-group"><label>Bitrate (kbps)</label><input type="range" name="bps_1" min="512" max="4096" step="64" value="${params.bps_1 || 2048}"><span>${params.bps_1 || 2048}</span></div>
                <div class="form-group range-group"><label>Frame Rate (FPS)</label><input type="range" name="fps_1" min="1" max="30" value="${params.fps_1 || 15}"><span>${params.fps_1 || 15}</span></div>
                
                <div class="form-group">
                    <label>Controlo de Bitrate</label>
                    <div class="radio-group">
                        <input type="radio" id="form_brmode1_0" name="brmode_1" value="0" ${params.brmode_1 === '0' ? 'checked' : ''}><label for="form_brmode1_0">CBR (Fixo)</label>
                        <input type="radio" id="form_brmode1_1" name="brmode_1" value="1" ${params.brmode_1 === '1' ? 'checked' : ''}><label for="form_brmode1_1">VBR (Variável)</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Qualidade de Imagem (VBR)</label>
                    <select name="imagegrade_1">
                        <option value="1" ${params.imagegrade_1 === '1' ? 'selected' : ''}>1 (Melhor)</option>
                        <option value="2" ${params.imagegrade_1 === '2' ? 'selected' : ''}>2</option>
                        <option value="3" ${params.imagegrade_1 === '3' ? 'selected' : ''}>3</option>
                        <option value="4" ${params.imagegrade_1 === '4' ? 'selected' : ''}>4</option>
                        <option value="5" ${params.imagegrade_1 === '5' ? 'selected' : ''}>5</option>
                        <option value="6" ${params.imagegrade_1 === '6' ? 'selected' : ''}>6 (Mais Baixa)</option>
                    </select>
                </div>
                <hr>
                <h3>Stream Secundário</h3>
                 <div class="form-group" id="size2max_tr">
                    <label>Resolução</label>
                    <select id="form_size2max" name="resolution_sub_max">
                        <option value="800x600" ${params.height_2 === '600' ? 'selected' : ''}>800x600</option>
                        <option value="640x480" ${params.height_2 === '480' ? 'selected' : ''}>640x480</option>
                    </select>
                </div>
                <div class="form-group" id="size2min_tr" style="display:none;">
                    <label>Resolução</label>
                    <select id="form_size2min" name="resolution_sub_min">
                        <option value="800x448" ${params.height_2 === '448' ? 'selected' : ''}>800x448</option>
                        <option value="640x352" ${params.height_2 === '352' ? 'selected' : ''}>640x352</option>
                    </select>
                </div>
                <div class="form-group range-group"><label>Bitrate (kbps)</label><input type="range" name="bps_2" min="128" max="1024" step="32" value="${params.bps_2 || 512}"><span>${params.bps_2 || 512}</span></div>
                <div class="form-group range-group"><label>Frame Rate (FPS)</label><input type="range" name="fps_2" min="1" max="30" value="${params.fps_2 || 15}"><span>${params.fps_2 || 15}</span></div>

                <div class="form-group">
                    <label>Controlo de Bitrate</label>
                    <div class="radio-group">
                        <input type="radio" id="form_brmode2_0" name="brmode_2" value="0" ${params.brmode_2 === '0' ? 'checked' : ''}><label for="form_brmode2_0">CBR (Fixo)</label>
                        <input type="radio" id="form_brmode2_1" name="brmode_2" value="1" ${params.brmode_2 === '1' ? 'checked' : ''}><label for="form_brmode2_1">VBR (Variável)</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Qualidade de Imagem (VBR)</label>
                    <select name="imagegrade_2">
                        <option value="1" ${params.imagegrade_2 === '1' ? 'selected' : ''}>1 (Melhor)</option>
                        <option value="2" ${params.imagegrade_2 === '2' ? 'selected' : ''}>2</option>
                        <option value="3" ${params.imagegrade_2 === '3' ? 'selected' : ''}>3</option>
                        <option value="4" ${params.imagegrade_2 === '4' ? 'selected' : ''}>4</option>
                        <option value="5" ${params.imagegrade_2 === '5' ? 'selected' : ''}>5</option>
                        <option value="6" ${params.imagegrade_2 === '6' ? 'selected' : ''}>6 (Mais Baixa)</option>
                    </select>
                </div>
                <button type="submit" style="width: 100%; margin-top: 20px;">Salvar Todas as Configurações de Vídeo</button>
            </form>
        </div>
        <div class="snapshot-column">
            <h3>Pré-visualização ao Vivo</h3>
            <div class="snapshot-container"><canvas id="video_canvas_video"></canvas></div>
            <div class="info-section">
                <h4>Informação Geral</h4>
                <p><strong>Utilizadores Online:</strong> ${params.stream_num || '0'}</p>
            </div>
        </div>
    </div>`;
}