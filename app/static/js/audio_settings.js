// app/static/js/audio_settings.js

/**
 * Gera o conteúdo HTML completo para a página de configurações de Áudio.
 * @param {object} params - O objeto contendo todos os parâmetros de áudio.
 * @returns {string} - A string HTML para ser inserida no DOM.
 */
export function renderAudioPage(params) {
    return `
    <div class="settings-container">
        <div class="form-column">
            <form id="form-audio-flag" class="form-section" data-set-cmd="setaudioflag">
                <h3>Áudio Geral</h3>
                <div class="form-group">
                    <label>Ativar Funcionalidades de Áudio</label>
                    <select name="audioflag">
                        <option value="1" ${params.audioflag === '1' ? 'selected' : ''}>Ligado</option>
                        <option value="0" ${params.audioflag === '0' ? 'selected' : ''}>Desligado</option>
                    </select>
                </div>
                <button type="submit">Salvar Estado do Áudio</button>
            </form>

            <form id="form-audio-codec-main" class="form-section" data-set-cmd="setaencattr">
                <h3>Codificação de Áudio (Stream Principal)</h3>
                <div class="form-group">
                    <label>Áudio no Stream</label>
                    <div class="radio-group">
                        <input type="radio" name="aeswitch" value="1" ${params.aeswitch_1 === '1' ? 'checked' : ''}><label>Ligado</label>
                        <input type="radio" name="aeswitch" value="0" ${params.aeswitch_1 === '0' ? 'checked' : ''}><label>Desligado</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Codec de Áudio</label>
                    <select name="aeformat">
                        <option value="g711a" ${params.aeformat_1 === 'g711a' ? 'selected' : ''}>G.711a (64Kbps)</option>
                        <option value="g726" ${params.aeformat_1 === 'g726' ? 'selected' : ''}>G.726 (16Kbps)</option>
                    </select>
                </div>
                <button type="submit" data-chn="11">Salvar Stream Principal</button>
            </form>

            <form id="form-audio-codec-sub" class="form-section" data-set-cmd="setaencattr">
                <h3>Codificação de Áudio (Stream Secundário)</h3>
                <div class="form-group">
                    <label>Áudio no Stream</label>
                    <div class="radio-group">
                        <input type="radio" name="aeswitch" value="1" ${params.aeswitch_2 === '1' ? 'checked' : ''}><label>Ligado</label>
                        <input type="radio" name="aeswitch" value="0" ${params.aeswitch_2 === '0' ? 'checked' : ''}><label>Desligado</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Codec de Áudio</label>
                    <select name="aeformat">
                        <option value="g711a" ${params.aeformat_2 === 'g711a' ? 'selected' : ''}>G.711a (64Kbps)</option>
                        <option value="g726" ${params.aeformat_2 === 'g726' ? 'selected' : ''}>G.726 (16Kbps)</option>
                    </select>
                </div>
                <button type="submit" data-chn="12">Salvar Stream Secundário</button>
            </form>
            </div>
        <div class="form-column">
            <form id="form-audio-in" class="form-section" data-set-cmd="setaudioinvolume">
                <h3>Entrada de Áudio (Microfone)</h3>
                <div class="form-group range-group"><label>Volume</label><input type="range" name="volume" min="1" max="100" value="${params.volume || 80}"><span>${params.volume || 80}</span></div>
                <div class="form-group"><label>Tipo de Entrada</label><select name="volin_type"><option value="1" ${params.volin_type === '1' ? 'selected' : ''}>Microfone</option><option value="0" ${params.volin_type === '0' ? 'selected' : ''}>Line-in</option></select></div>
                <div class="form-group"><label>Redução de Ruído</label><select name="denoise"><option value="1" ${params.denoise === '1' ? 'selected' : ''}>Ligado</option><option value="0" ${params.denoise === '0' ? 'selected' : ''}>Desligado</option></select></div>
                <div class="form-group"><label>Cancelamento de Eco</label><select name="aec"><option value="1" ${params.aec === '1' ? 'selected' : ''}>Ligado</option><option value="0" ${params.aec === '0' ? 'selected' : ''}>Desligado</option></select></div>
                <button type="submit">Salvar Configurações do Microfone</button>
            </form>

            <form id="form-audio-out" class="form-section" data-set-cmd="setaudiooutvolume">
                <h3>Saída de Áudio (Altifalante)</h3>
                <div class="form-group range-group"><label>Volume</label><input type="range" name="ao_volume" min="1" max="100" value="${params.ao_volume || 95}"><span>${params.ao_volume || 95}</span></div>
                <button type="submit">Salvar Volume do Altifalante</button>
            </form>

            <form id="form-audio-alarm" class="form-section" data-set-cmd="setaudioalarmattr">
                <h3>Alarme por Deteção de Som</h3>
                <div class="form-group"><label>Ativar Alarme por Som</label><select name="aa_enable"><option value="1" ${params.aa_enable === '1' ? 'selected' : ''}>Ligado</option><option value="0" ${params.aa_enable === '0' ? 'selected' : ''}>Desligado</option></select></div>
                <div class="form-group range-group"><label>Sensibilidade</label><input type="range" name="aa_value" min="1" max="100" value="${params.aa_value || 50}"><span>${params.aa_value || 50}</span></div>
                <button type="submit">Salvar Alarme por Som</button>
            </form>

            <form id="form-alarm-sound" class="form-section" data-set-cmd="setalarmsoundattr">
                <h3>Sirene de Alarme</h3>
                <div class="form-group"><label>Ativar Som no Alarme</label><select name="md_sound_switch"><option value="on" ${params.md_sound_switch === 'on' ? 'selected' : ''}>Ligado</option><option value="off" ${params.md_sound_switch === 'off' ? 'selected' : ''}>Desligado</option></select></div>
                <div class="form-group"><label>Tipo de Som</label><select name="sound_type"><option value="0" ${params.sound_type === '0' ? 'selected' : ''}>Campainha</option><option value="1" ${params.sound_type === '1' ? 'selected' : ''}>Cão a Ladrar</option><option value="2" ${params.sound_type === '2' ? 'selected' : ''}>Personalizado</option></select></div>
                <div class="form-group range-group"><label>Duração (s)</label><input type="range" name="sound_time" min="1" max="60" value="${params.sound_time || 10}"><span>${params.sound_time || 10}</span></div>
                <button type="submit" data-set-cmd="setalarmsoundattr">Salvar Sirene de Alarme</button>
            </form>
        </div>
    </div>
    `;
}