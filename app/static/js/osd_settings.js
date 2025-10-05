// app/static/js/osd_settings.js

export function renderOsdPage(params) {
    let osdControlsHtml = `
        <fieldset><legend>Data/Hora (Região 0)</legend>
            <div class="form-group-row">
                <label>Exibir</label><select name="show_0"><option value="1" ${params.show_0 === '1' ? 'selected' : ''}>Sim</option><option value="0" ${params.show_0 === '0' ? 'selected' : ''}>Não</option></select>
                <label>Posição</label><select name="place_0"><option value="0" ${params.place_0 === '0' ? 'selected' : ''}>Topo Esquerdo</option><option value="1" ${params.place_0 === '1' ? 'selected' : ''}>Topo Direito</option><option value="2" ${params.place_0 === '2' ? 'selected' : ''}>Fundo Esquerdo</option><option value="3" ${params.place_0 === '3' ? 'selected' : ''}>Fundo Direito</option></select>
            </div>
        </fieldset>
        <fieldset><legend>Nome da Câmara (Região 1)</legend>
            <div class="form-group-row">
                <label>Exibir</label><select name="show_1"><option value="1" ${params.show_1 === '1' ? 'selected' : ''}>Sim</option><option value="0" ${params.show_1 === '0' ? 'selected' : ''}>Não</option></select>
                <label>Posição</label><select name="place_1"><option value="0" ${params.place_1 === '0' ? 'selected' : ''}>Topo Esquerdo</option><option value="1" ${params.place_1 === '1' ? 'selected' : ''}>Topo Direito</option><option value="2" ${params.place_1 === '2' ? 'selected' : ''}>Fundo Esquerdo</option><option value="3" ${params.place_1 === '3' ? 'selected' : ''}>Fundo Direito</option></select>
            </div>
            <div class="form-group"><label>Texto</label><input type="text" name="name_1" value="${params.name_1 || 'ipCAM'}"></div>
        </fieldset>
    `;

    let coverControlsHtml = '';
    for (let i = 1; i <= 4; i++) {
        coverControlsHtml += `
        <fieldset><legend>Máscara ${i}</legend>
            <div class="form-group-row compact">
                <input type="checkbox" name="show_${i}" id="show_${i}" ${params[`show_${i}`] === '1' ? 'checked' : ''} value="1"><label for="show_${i}">Ativa</label>
                <input type="color" name="color_${i}" value="#${params[`color_${i}`] || '000000'}">
                <input type="number" name="x_${i}" placeholder="X" value="${params[`x_${i}`] || 0}">
                <input type="number" name="y_${i}" placeholder="Y" value="${params[`y_${i}`] || 0}">
                <input type="number" name="w_${i}" placeholder="W" value="${params[`w_${i}`] || 100}">
                <input type="number" name="h_${i}" placeholder="H" value="${params[`h_${i}`] || 100}">
            </div>
        </fieldset>`;
    }

    return `
    <div class="settings-container">
        <div class="form-column">
            <form id="form-osd" class="form-section">
                <h3>Sobreposição de Texto (OSD)</h3>
                ${osdControlsHtml}
                <button type="submit">Salvar OSD</button>
            </form>
            <form id="form-covers" class="form-section">
                <h3>Máscaras de Privacidade</h3>
                ${coverControlsHtml}
                <button type="submit">Salvar Máscaras</button>
            </form>
        </div>
        <div class="snapshot-column">
            <h3>Pré-visualização Interativa</h3>
            <div id="preview-container" class="snapshot-container">
                <img src="/api/snapshot" alt="Snapshot" id="snapshot-bg">
                <div id="preview-osd-0" class="osd-preview-text"></div>
                <div id="preview-osd-1" class="osd-preview-text"></div>
                <div id="preview-cover-1" class="cover-preview-box"><div class="resize-handle"></div></div>
                <div id="preview-cover-2" class="cover-preview-box"><div class="resize-handle"></div></div>
                <div id="preview-cover-3" class="cover-preview-box"><div class="resize-handle"></div></div>
                <div id="preview-cover-4" class="cover-preview-box"><div class="resize-handle"></div></div>
            </div>
        </div>
    </div>`;
}