document.addEventListener('DOMContentLoaded', () => {
    // --- Referências a elementos da UI ---
    const notificationDiv = document.getElementById('notification');
    const motionAreasContainer = document.getElementById('motion-areas-container');
    const snapshotContainer = document.getElementById('snapshot-container');
    const snapshotImg = document.getElementById('snapshot-img');
    const API_BASE_URL = '/api/alarms';
    const STATUS_API_URL = '/api/status';
    let mainStreamWidth = 1920, mainStreamHeight = 1080;
	const SMD_INTERNAL_WIDTH = 1280;
    const SMD_INTERNAL_HEIGHT = 720;

    // --- Funções Utilitárias e de API ---
    function showNotification(message, isError = false) {
        notificationDiv.textContent = message;
        notificationDiv.className = `notification ${isError ? 'error' : 'success'}`;
        notificationDiv.style.display = 'block';
        setTimeout(() => { notificationDiv.style.display = 'none'; }, 4000);
    }
    async function fetchData(endpoint) {
        // Lógica para escolher o URL base correto
        const baseUrl = endpoint.startsWith('status/') ? STATUS_API_URL : API_BASE_URL;
        const finalEndpoint = endpoint.replace('status/', ''); // Remove o prefixo para a chamada
        try {
            const response = await fetch(`${baseUrl}/${finalEndpoint}`);
            if (!response.ok) throw new Error(`Network error for ${endpoint}`);
            const result = await response.json();
            if (result.status === 'failed') throw new Error(result.error);
            return result.data;
        } catch (error) {
            showNotification(`Error loading data from ${endpoint}: ${error.message}`, true);
            throw error;
        }
    }
    async function saveData(endpoint, payload) {
        try {
            const response = await fetch(`${API_BASE_URL}/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const result = await response.json();
            if (!response.ok || result.status === 'failed') throw new Error(result.error || 'Unknown camera error');
            return result;
        } catch (error) {
            throw error;
        }
    }

function generateActionCheckboxes(prerequisites) {
        const preset_label_info = prerequisites.ptz_preset_configured ? `(Preset: ${prerequisites.alarm_preset_index})` : '(não configurado)';
        const actions = { snap: 'Capturar Imagem (SD)', record: 'Gravar Vídeo (SD)', emailsnap: 'Enviar Email com Imagem', ftpsnap: 'Enviar Imagem para FTP', ftprec: 'Enviar Vídeo para FTP', relay: 'Ativar Relé de Saída', emailrec: 'Enviar Gravação por Email', server: 'Notificar Servidor de Alarme', preset: `Ir para Posição PTZ ${preset_label_info}`};
        
        let html = '';
        for (const [key, label] of Object.entries(actions)) {
            html += `<div class="form-group" style="flex-direction: row; align-items: center;"><input type="checkbox" id="action-${key}" name="${key}" style="width: auto;"><label for="action-${key}" style="margin-bottom: 0;">${label}</label></div>`;
            if (key === 'snap') {
                html += `<div id="snapshot-options-container" class="sub-options-container"></div>`;
            }
            if (key === 'relay') {
                html += `<div id="relay-options-container" class="sub-options-container"></div>`;
            }
        }
        document.getElementById('alarm-actions-container').innerHTML = html;
    }
	
	function generateSnapshotOptions(data) {
        const container = document.getElementById('snapshot-options-container');
        if (!container) return;
        const nameMode = data.snap_name_mode || '0';
        const snapCount = data.snap_count || '1';
        const alarmName = data.snap_alarm_name || '';
        container.innerHTML = `<div class="form-group"><label for="snap_count" style="font-weight:normal;">Número de Fotos</label><select id="snap_count" name="snap_count"><option value="1" ${snapCount === '1' ? 'selected' : ''}>1 Foto</option><option value="2" ${snapCount === '2' ? 'selected' : ''}>2 Fotos</option><option value="3" ${snapCount === '3' ? 'selected' : ''}>3 Fotos</option></select></div><div class="form-group"><label for="snap_name_mode" style="font-weight:normal;">Modo de Nomeação</label><select id="snap_name_mode" name="snap_name_mode"><option value="0" ${nameMode === '0' ? 'selected' : ''}>Data e Hora</option><option value="1" ${nameMode === '1' ? 'selected' : ''}>Nome Fixo</option></select></div><div class="form-group" id="snap_alarm_name_group" style="display: ${nameMode === '1' ? 'block' : 'none'};"><label for="snap_alarm_name" style="font-weight:normal;">Nome Fixo do Ficheiro</label><input type="text" id="snap_alarm_name" name="snap_alarm_name" value="${alarmName}"></div>`;
        document.getElementById('snap_name_mode').addEventListener('change', (e) => {
            document.getElementById('snap_alarm_name_group').style.display = e.target.value === '1' ? 'block' : 'none';
        });
    }

function generateRelayOptions(data) {
        const container = document.getElementById('relay-options-container');
        if (!container) return;
        const relayTime = data.time || '5';
        container.innerHTML = `
            <div class="form-group">
                <label for="relay_time" style="font-weight:normal;">Duração de Ativação (segundos)</label>
                <select id="relay_time" name="relay_time">
                    <option value="5" ${relayTime === '5' ? 'selected' : ''}>5s</option>
                    <option value="10" ${relayTime === '10' ? 'selected' : ''}>10s</option>
                    <option value="20" ${relayTime === '20' ? 'selected' : ''}>20s</option>
                    <option value="30" ${relayTime === '30' ? 'selected' : ''}>30s</option>
                </select>
            </div>
        `;
    }
    
    function applyValidationsAndTooltips(prerequisites) {
        const validationMap = [['action-snap', prerequisites.sd_ready, 'Ação desativada: Cartão SD não está pronto.'], ['action-record', prerequisites.sd_ready, 'Ação desativada: Cartão SD não está pronto.'], ['action-emailsnap', prerequisites.smtp_configured, 'Ação desativada: Email (SMTP) não configurado.'], ['action-ftpsnap', prerequisites.ftp_configured, 'Ação desativada: FTP não configurado.'], ['action-ftprec', prerequisites.ftp_configured, 'Ação desativada: FTP não configurado.'], ['action-preset', prerequisites.ptz_preset_configured, 'Ação desativada: Nenhum preset de alarme configurado.'], ['action-server', prerequisites.alarm_server_configured, 'Ação desativada: Servidor de alarme não configurado.']];
        validationMap.forEach(([checkboxId, isEnabled, tooltipMessage]) => {
            const checkbox = document.getElementById(checkboxId); if (!checkbox) return;
            const container = checkbox.closest('.form-group');
            if (isEnabled) { checkbox.disabled = false; if(container) { container.classList.remove('disabled-container'); container.title = ''; } }
            else { checkbox.disabled = true; checkbox.checked = false; if(container) { container.classList.add('disabled-container'); container.title = tooltipMessage; } }
        });
    }

    function generateMotionAreaForms() {
        let formHtml = '';
        for (let i = 1; i <= 4; i++) { formHtml += `<fieldset><legend>Área ${i}</legend><div class="form-group"><label for="md_enable_${i}">Ativar Área</label><select id="md_enable_${i}"><option value="0">Não</option><option value="1">Sim</option></select></div><div class="form-group range-group"><label for="md_s_${i}">Sensibilidade</label><input type="range" id="md_s_${i}" min="1" max="100"><span id="md_s_output_${i}">50</span></div><div class="form-group" style="display: none;"><input type="number" id="md_x_${i}" disabled><input type="number" id="md_y_${i}" disabled><input type="number" id="md_w_${i}" disabled><input type="number" id="md_h_${i}" disabled></div></fieldset>`; const previewBox = document.createElement('div'); previewBox.id = `motion-area-${i}`; previewBox.className = `motion-preview-box motion-area-${i}`; previewBox.innerHTML = '<div class="resize-handle"></div>'; previewBox.style.display = 'none'; snapshotContainer.appendChild(previewBox); }
        motionAreasContainer.innerHTML = formHtml;
        const smdPreviewBox = document.createElement('div'); smdPreviewBox.id = 'smd-area-preview'; smdPreviewBox.className = 'motion-preview-box'; smdPreviewBox.style.border = '2px dotted cyan'; smdPreviewBox.innerHTML = '<div class="resize-handle"></div>'; smdPreviewBox.style.display = 'none'; snapshotContainer.appendChild(smdPreviewBox);
    }
    
    function generateScheduleGrid() { const container = document.getElementById('schedule-grid-container'); const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']; let html = '<div class="schedule-header"></div>'; for (let i = 0; i < 24; i++) html += `<div class="schedule-header" style="grid-column: span 2;">${i}h</div>`; days.forEach((day, dayIndex) => { html += `<div class="schedule-day-label">${day}</div>`; for (let slot = 0; slot < 48; slot++) html += `<div class="schedule-slot" data-day="${dayIndex}" data-slot="${slot}"></div>`; }); container.innerHTML = html; }
    function populateMotionUI(data) { for (let i = 1; i <= 4; i++) { const enableEl = document.getElementById(`md_enable_${i}`); if(enableEl) enableEl.value = data[`m${i}_enable`] || '0'; const s = data[`m${i}_sensitivity`] || '50'; const sSlider = document.getElementById(`md_s_${i}`); if(sSlider) sSlider.value = s; const sOutput = document.getElementById(`md_s_output_${i}`); if(sOutput) sOutput.textContent = s; document.getElementById(`md_x_${i}`).value = data[`m${i}_x`] || 0; document.getElementById(`md_y_${i}`).value = data[`m${i}_y`] || 0; document.getElementById(`md_w_${i}`).value = data[`m${i}_w`] || 0; document.getElementById(`md_h_${i}`).value = data[`m${i}_h`] || 0; } }
    function populateScheduleUI(data) { for (let d = 0; d < 7; d++) { const w = data[`week${d}`] || 'N'.repeat(48); for (let s = 0; s < 48; s++) { const c = document.querySelector(`.schedule-slot[data-day='${d}'][data-slot='${s}']`); if (c) c.classList.toggle('active', w[s] === 'P'); } } }
    function populateIoUI(data) { document.getElementById('io_enable').value = data.io_enable || '0'; document.getElementById('io_flag').value = data.io_flag || '0'; document.getElementById('pir_enable').value = data.pir_enable || '0'; document.getElementById('aa_enable').value = data.aa_enable || '0'; const val = data.aa_value || '75'; document.getElementById('aa_value').value = val; document.getElementById('aa_value_output').textContent = val; }
	function populateActionsUI(data) { Object.keys(data).forEach(key => { const actionName = key.replace('md_', '').replace('_switch', ''); const checkbox = document.getElementById(`action-${actionName}`); if (checkbox) { checkbox.checked = (data[key] === 'on'); } }); }
	function populateSmartFeaturesUI(data) {
        document.getElementById('smartrack_enable').value = data.smartrack_enable || '0';
        document.getElementById('smartrack_timeout').value = data.smartrack_timeout || '60';
        document.getElementById('smd_enable').value = data.smd_enable || '0';
        document.getElementById('smd_rect').value = data.smd_rect || '0';
        const smd_gthresh_val = data.smd_gthresh || '50';
        document.getElementById('smd_gthresh').value = smd_gthresh_val;
        document.getElementById('smd_gthresh_output').textContent = smd_gthresh_val;
        document.getElementById('smd_threshold').value = data.smd_threshold || '500';

        const widthScaleUp = mainStreamWidth / SMD_INTERNAL_WIDTH;
        const heightScaleUp = mainStreamHeight / SMD_INTERNAL_HEIGHT;
        document.getElementById('smd_x').value = Math.round((data.smd_x || 0) * widthScaleUp);
        document.getElementById('smd_y').value = Math.round((data.smd_y || 0) * heightScaleUp);
        document.getElementById('smd_w').value = Math.round((data.smd_w || 0) * widthScaleUp);
        document.getElementById('smd_h').value = Math.round((data.smd_h || 0) * heightScaleUp);
    }
    function updatePreview() { if (!snapshotImg || !snapshotImg.complete || snapshotImg.naturalWidth === 0) return; const scale = snapshotImg.offsetWidth / mainStreamWidth; for (let i = 1; i <= 4; i++) { const box = document.getElementById(`motion-area-${i}`); if (!box) continue; const isEnabled = document.getElementById(`md_enable_${i}`).value === '1'; if (isEnabled) { box.style.display = 'block'; const x = parseInt(document.getElementById(`md_x_${i}`).value, 10), y = parseInt(document.getElementById(`md_y_${i}`).value, 10); const w = parseInt(document.getElementById(`md_w_${i}`).value, 10), h = parseInt(document.getElementById(`md_h_${i}`).value, 10); box.style.left = `${x * scale}px`; box.style.top = `${y * scale}px`; box.style.width = `${w * scale}px`; box.style.height = `${h * scale}px`; } else { box.style.display = 'none'; } } const smdBox = document.getElementById('smd-area-preview'); if (!smdBox) return; const isSmdEnabled = document.getElementById('smd_enable').value === '1'; if (isSmdEnabled) { smdBox.style.display = 'block'; const x = parseInt(document.getElementById('smd_x').value, 10), y = parseInt(document.getElementById('smd_y').value, 10); const w = parseInt(document.getElementById('smd_w').value, 10), h = parseInt(document.getElementById('smd_h').value, 10); smdBox.style.left = `${x * scale}px`; smdBox.style.top = `${y * scale}px`; smdBox.style.width = `${w * scale}px`; smdBox.style.height = `${h * scale}px`; } else { smdBox.style.display = 'none'; } }
    function initInteractiveAreas() { const createInteractiveHandlers = (box, idPrefix) => { const handle = box.querySelector('.resize-handle'); const updateInputsFromPreview = () => { const scale = snapshotImg.offsetWidth / mainStreamWidth; if (scale === 0) return; document.getElementById(`${idPrefix}_x`).value = Math.round(box.offsetLeft / scale); document.getElementById(`${idPrefix}_y`).value = Math.round(box.offsetTop / scale); document.getElementById(`${idPrefix}_w`).value = Math.round(box.offsetWidth / scale); document.getElementById(`${idPrefix}_h`).value = Math.round(box.offsetHeight / scale); }; const onDragMouseDown = (e_down) => { if (e_down.target === handle) return; e_down.preventDefault(); const { offsetLeft: startLeft, offsetTop: startTop } = box, { clientX: startX, clientY: startY } = e_down; const onDragMouseMove = (e_move) => { const rect = snapshotContainer.getBoundingClientRect(), dx = e_move.clientX - startX, dy = e_move.clientY - startY; box.style.left = `${Math.max(0, Math.min(startLeft + dx, rect.width - box.offsetWidth))}px`; box.style.top = `${Math.max(0, Math.min(startTop + dy, rect.height - box.offsetHeight))}px`; updateInputsFromPreview(); }; const onDragMouseUp = () => { document.removeEventListener('mousemove', onDragMouseMove); document.removeEventListener('mouseup', onDragMouseUp); }; document.addEventListener('mousemove', onDragMouseMove); document.addEventListener('mouseup', onDragMouseUp); }; const onResizeMouseDown = (e_down) => { e_down.preventDefault(); e_down.stopPropagation(); const { offsetWidth: startWidth, offsetHeight: startHeight } = box, { clientX: startX, clientY: startY } = e_down; const onResizeMouseMove = (e_move) => { const rect = snapshotContainer.getBoundingClientRect(), dx = e_move.clientX - startX, dy = e_move.clientY - startY; box.style.width = `${Math.max(20, Math.min(startWidth + dx, rect.width - box.offsetLeft))}px`; box.style.height = `${Math.max(20, Math.min(startHeight + dy, rect.height - box.offsetTop))}px`; updateInputsFromPreview(); }; const onResizeMouseUp = () => { document.removeEventListener('mousemove', onResizeMouseMove); document.removeEventListener('mouseup', onResizeMouseUp); }; document.addEventListener('mousemove', onResizeMouseMove); document.addEventListener('mouseup', onResizeMouseUp); }; box.addEventListener('mousedown', onDragMouseDown); handle.addEventListener('mousedown', onResizeMouseDown); }; for (let i = 1; i <= 4; i++) { const box = document.getElementById(`motion-area-${i}`); if (box) createInteractiveHandlers(box, `md_${i}`); } const smdBox = document.getElementById('smd-area-preview'); if (smdBox) createInteractiveHandlers(smdBox, 'smd'); }    
    function initScheduleInteraction() { const grid = document.getElementById('schedule-grid-container'); let isPainting = false; let paintMode = null; grid.addEventListener('mousedown', e => { if (e.target.classList.contains('schedule-slot')) { e.preventDefault(); isPainting = true; paintMode = !e.target.classList.contains('active'); e.target.classList.toggle('active', paintMode); } }); grid.addEventListener('mouseover', e => { if (isPainting && e.target.classList.contains('schedule-slot')) e.target.classList.toggle('active', paintMode); }); document.addEventListener('mouseup', () => { isPainting = false; }); grid.addEventListener('mouseleave', () => { isPainting = false; }); }   
    function collectMotionPayload() { return {...[1,2,3,4].reduce((a,i)=>({...a,[`area${i}`]:{enable:document.getElementById(`md_enable_${i}`).value,sensitivity:document.getElementById(`md_s_${i}`).value,x:document.getElementById(`md_x_${i}`).value,y:document.getElementById(`md_y_${i}`).value,w:document.getElementById(`md_w_${i}`).value,h:document.getElementById(`md_h_${i}`).value}}),{})} }
    function collectActionsPayload() { return {...Array.from(document.querySelectorAll('#alarm-actions-container input[type="checkbox"]')).reduce((a,c)=>({...a,[c.name]:c.checked}),{})} }
    function collectSchedulePayload() { const p={};for(let d=0;d<7;d++){p[`week${d}`]=Array.from(Array(48).keys()).map(s=>document.querySelector(`.schedule-slot[data-day='${d}'][data-slot='${s}']`)?.classList.contains('active')?'P':'N').join('')}return p }
    function collectIoPayload() { return {io_enable:document.getElementById('io_enable').value,io_flag:document.getElementById('io_flag').value,pir_enable:document.getElementById('pir_enable').value,aa_enable:document.getElementById('aa_enable').value,aa_value:document.getElementById('aa_value').value} }
    function collectSmartFeaturesPayload() {
        return { 
            smartrack_enable: document.getElementById('smartrack_enable').value, 
            smartrack_timeout: document.getElementById('smartrack_timeout').value, 
            smd_enable: document.getElementById('smd_enable').value, 
            smd_rect: document.getElementById('smd_rect').value, 
            smd_gthresh: document.getElementById('smd_gthresh').value, 
            smd_threshold: document.getElementById('smd_threshold').value, 
            // Envia os valores da UI diretamente, sem pré-ajustes
            smd_x: document.getElementById('smd_x').value,
            smd_y: document.getElementById('smd_y').value,
            smd_w: document.getElementById('smd_w').value,
            smd_h: document.getElementById('smd_h').value
        };
    }
	function collectSnapshotOptionsPayload() {
        const snapNameMode = document.getElementById('snap_name_mode');
        if (!snapNameMode) return null;
        return { snap_count: document.getElementById('snap_count').value, snap_name_mode: snapNameMode.value, snap_alarm_name: document.getElementById('snap_alarm_name').value };
    }	
	
	function collectRelayPayload() {
        const relayTimeSelect = document.getElementById('relay_time');
        if (!relayTimeSelect) return null;
        return { time: relayTimeSelect.value };
    }
	
	async function saveAllSettings() {
        showNotification('A salvar todas as configurações...', false);
        try {
            const promises = [ saveData('motion_detection', collectMotionPayload()),
			saveData('actions', collectActionsPayload()), saveData('schedule', collectSchedulePayload()),
			saveData('io_settings', collectIoPayload()), saveData('smart_features', collectSmartFeaturesPayload()) ];
            if (document.getElementById('action-snap')?.checked) {
                const snapshotPayload = collectSnapshotOptionsPayload();
                if (snapshotPayload) { promises.push(saveData('snapshot_settings', snapshotPayload)); }
            }
            if (document.getElementById('action-relay')?.checked) {
                const relayPayload = collectRelayPayload();
                if (relayPayload) { promises.push(saveData('relay_settings', relayPayload)); }
            }
            await Promise.all(promises);
            showNotification('Todas as configurações foram salvas com sucesso!', false);
        } catch (error) {
            showNotification(`Falha ao salvar: ${error.message || 'Erro desconhecido'}`, true);
        }
    }
    
    function setupEventListeners() {
        document.getElementById('save-button').addEventListener('click', saveAllSettings);
        document.getElementById('reload-button').addEventListener('click', initializePage);
        document.getElementById('schedule-select-all').addEventListener('click', () => document.querySelectorAll('.schedule-slot').forEach(s => s.classList.add('active')));
        document.getElementById('schedule-clear-all').addEventListener('click', () => document.querySelectorAll('.schedule-slot').forEach(s => s.classList.remove('active')));
		const snapCheckbox = document.getElementById('action-snap');
        if (snapCheckbox) {
            snapCheckbox.addEventListener('change', (e) => {
                const optionsContainer = document.getElementById('snapshot-options-container');
                if (e.target.checked) {
                    fetchData('snapshot_settings').then(data => { generateSnapshotOptions(data); optionsContainer.style.display = 'block'; });
                } else {
                    optionsContainer.style.display = 'none'; optionsContainer.innerHTML = '';
                }
            });
        }
		const relayCheckbox = document.getElementById('action-relay');
        if (relayCheckbox) {
            relayCheckbox.addEventListener('change', (e) => {
                const optionsContainer = document.getElementById('relay-options-container');
                if (e.target.checked) {
                    fetchData('relay_settings').then(data => { generateRelayOptions(data); optionsContainer.style.display = 'block'; });
                } else {
                    optionsContainer.style.display = 'none'; optionsContainer.innerHTML = '';
                }
            });
        }
        for (let i = 1; i <= 4; i++) {
            const sSlider = document.getElementById(`md_s_${i}`); if (sSlider) sSlider.addEventListener('input', () => document.getElementById(`md_s_output_${i}`).textContent = sSlider.value);
            const enableSelect = document.getElementById(`md_enable_${i}`);
            if (enableSelect) enableSelect.addEventListener('change', () => {
                const wInput = document.getElementById(`md_w_${i}`);
                if (enableSelect.value === '1' && (!wInput.value || parseInt(wInput.value, 10) < 20)) {
                    const w = mainStreamWidth * 0.25, h = mainStreamHeight * 0.25; const x = (mainStreamWidth - w) / 2, y = (mainStreamHeight - h) / 2;
                    document.getElementById(`md_x_${i}`).value = Math.round(x); document.getElementById(`md_y_${i}`).value = Math.round(y); document.getElementById(`md_w_${i}`).value = Math.round(w); document.getElementById(`md_h_${i}`).value = Math.round(h);
                }
                updatePreview();
            });
        }
        const audioSlider = document.getElementById('aa_value'); if(audioSlider) audioSlider.addEventListener('input', () => document.getElementById('aa_value_output').textContent = audioSlider.value);
        const smdSlider = document.getElementById('smd_gthresh'); if(smdSlider) smdSlider.addEventListener('input', () => document.getElementById('smd_gthresh_output').textContent = smdSlider.value);
        const smdEnableSwitch = document.getElementById('smd_enable');
        const smdOptionsContainer = document.getElementById('smd_options_container');
        if (smdEnableSwitch && smdOptionsContainer) {
            const toggleSmdOptions = () => { const isEnabled = smdEnableSwitch.value === '1'; smdOptionsContainer.style.display = isEnabled ? 'block' : 'none'; updatePreview(); };
            smdEnableSwitch.addEventListener('change', toggleSmdOptions);
        }
    }
	
	function initTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabPanes = document.querySelectorAll('.tab-pane');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanes.forEach(pane => pane.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(button.dataset.tab).classList.add('active');
            });
        });
    }

    async function initializePage() {
        showNotification('A carregar configurações...', false);
        try {
            await new Promise((resolve, reject) => {
                snapshotImg.onload = resolve; snapshotImg.onerror = reject;
                if (snapshotImg.complete && snapshotImg.naturalWidth > 0) resolve();
            });
            mainStreamWidth = parseInt(snapshotContainer.dataset.mainWidth, 10) || 1920;
            mainStreamHeight = parseInt(snapshotContainer.dataset.mainHeight, 10) || 1080;
            
            // Gerar a estrutura HTML primeiro
            generateMotionAreaForms();
            // Carregar todos os dados da API em paralelo
            const [prerequisites, motionData, actionsData, scheduleData, ioData, smartData] = await Promise.all([
                fetchData('status/prerequisites'),
                fetchData('motion_detection'), 
                fetchData('actions'), 
                fetchData('schedule'), 
                fetchData('io_settings'),
                fetchData('smart_features')
            ]);
            
            // Agora que temos os pré-requisitos, podemos gerar o resto da UI
            generateActionCheckboxes(prerequisites);
            generateScheduleGrid();

            // Preencher todos os controlos com os dados
            populateMotionUI(motionData); 
            populateActionsUI(actionsData);
            populateScheduleUI(scheduleData); 
            populateIoUI(ioData);
            populateSmartFeaturesUI(smartData);
            applyValidationsAndTooltips(prerequisites);
			            
            // Ativar toda a interatividade
            initInteractiveAreas(); 
            initScheduleInteraction(); 
            setupEventListeners();
            
            updatePreview();
            // Dispara o evento de 'change' para garantir que a UI reflete o estado inicial
            document.getElementById('smd_enable').dispatchEvent(new Event('change'));
			
			const snapCheckbox = document.getElementById('action-snap');
            if (snapCheckbox?.checked) { snapCheckbox.dispatchEvent(new Event('change')); }            
			const relayCheckbox = document.getElementById('action-relay');
            if (relayCheckbox?.checked) { relayCheckbox.dispatchEvent(new Event('change')); }
            
            showNotification('Configurações carregadas com sucesso!', false);
        } catch (error) {
            showNotification(`Falha geral ao inicializar a página: ${error.message}`, true);
        }
    }

    initializePage();
});