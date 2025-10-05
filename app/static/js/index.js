// app/static/js/index.js
// Small module to keep the snapshot on the index page fresh and robust.
// Uses cache-busting query param and shows loading/error states.
// No globals created.

(() => {
    'use strict';

    const img = document.getElementById('snapshot-img');
    const refreshBtn = document.getElementById('snapshot-refresh');
    const autoToggle = document.getElementById('snapshot-auto-toggle');
    const statusEl = document.getElementById('snapshot-status');
    const spinner = document.getElementById('snapshot-spinner');

    if (!img) return;

    let autoTimer = null;
    const AUTO_INTERVAL_MS = 5000; // default auto-refresh interval

    function setStatus(message, level = 'info') {
        statusEl.textContent = message;
        statusEl.dataset.level = level;
    }

    function showSpinner(show) {
        if (!spinner) return;
        spinner.style.display = show ? 'flex' : 'none';
        if (show) {
            spinner.setAttribute('aria-hidden', 'false');
        } else {
            spinner.setAttribute('aria-hidden', 'true');
        }
    }

    // Load a fresh snapshot using a temporary Image to detect success/failure.
    function loadSnapshot() {
        const api = img.dataset.api || img.getAttribute('data-api') || img.src;
        if (!api) return;

        showSpinner(true);
        setStatus('Carregando...', 'info');

        const tmp = new Image();
        tmp.crossOrigin = 'anonymous';
        const url = `${api}${api.includes('?') ? '&' : '?'}t=${Date.now()}`;

        tmp.onload = () => {
            // Use the just-loaded image src so the visible element is updated only on success.
            img.src = tmp.src;
            showSpinner(false);
            setStatus('Atualizado', 'success');
        };

        tmp.onerror = () => {
            showSpinner(false);
            setStatus('Falha ao carregar snapshot', 'error');
        };

        // Start loading
        tmp.src = url;
    }

    function startAuto() {
        stopAuto();
        autoTimer = setInterval(loadSnapshot, AUTO_INTERVAL_MS);
        setStatus('Atualização automática ativada', 'info');
    }

    function stopAuto() {
        if (autoTimer) {
            clearInterval(autoTimer);
            autoTimer = null;
            setStatus('Atualização automática desativada', 'info');
        }
    }

    // Events
    refreshBtn.addEventListener('click', () => {
        loadSnapshot();
    });

    autoToggle.addEventListener('change', (e) => {
        if (e.target.checked) startAuto();
        else stopAuto();
    });

    // Initial load (only once)
    document.addEventListener('DOMContentLoaded', () => {
        // attempt to load a fresh image on page show
        loadSnapshot();
    });

    // If the page becomes visible again, refresh once to ensure fresh snapshot
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            loadSnapshot();
        }
    });
})();