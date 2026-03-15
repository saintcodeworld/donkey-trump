// ============================================================
// Donkey Kong JS - Responsive Canvas Handler
// Handles mobile/tablet responsive scaling and touch controls
// ============================================================

const ResponsiveHandler = (() => {
    let canvas = null;
    let container = null;
    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    const BASE_WIDTH = 854;
    const BASE_HEIGHT = 480;

    function init(canvasElement, containerElement) {
        canvas = canvasElement;
        container = containerElement;
        
        setupResponsiveCanvas();
        setupTouchControls();
        
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        
        handleResize();
    }

    function setupResponsiveCanvas() {
        canvas.style.maxWidth = '100%';
        canvas.style.maxHeight = '100vh';
        canvas.style.width = 'auto';
        canvas.style.height = 'auto';
    }

    function handleResize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        const scaleX = windowWidth / BASE_WIDTH;
        const scaleY = windowHeight / BASE_HEIGHT;
        scale = Math.min(scaleX, scaleY, 1);
        
        const scaledWidth = BASE_WIDTH * scale;
        const scaledHeight = BASE_HEIGHT * scale;
        
        container.style.width = scaledWidth + 'px';
        container.style.height = scaledHeight + 'px';
        
        offsetX = (windowWidth - scaledWidth) / 2;
        offsetY = (windowHeight - scaledHeight) / 2;
        
        // Show/hide mobile controls
        const isMobile = windowWidth < 768;
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = isMobile ? 'flex' : 'none';
        }
    }

    function setupTouchControls() {
        createMobileControls();
        setupTouchEvents();
    }

    function createMobileControls() {
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'mobileControls';
        controlsDiv.innerHTML = `
            <div class="mobile-dpad">
                <button class="dpad-btn dpad-up" data-key="ArrowUp">▲</button>
                <button class="dpad-btn dpad-left" data-key="ArrowLeft">◄</button>
                <button class="dpad-btn dpad-center"></button>
                <button class="dpad-btn dpad-right" data-key="ArrowRight">►</button>
                <button class="dpad-btn dpad-down" data-key="ArrowDown">▼</button>
            </div>
            <div class="mobile-actions">
                <button class="action-btn jump-btn" data-key="Space">JUMP</button>
                <button class="action-btn pause-btn" data-key="KeyP">⏸</button>
            </div>
        `;
        document.body.appendChild(controlsDiv);
    }

    function setupTouchEvents() {
        const buttons = document.querySelectorAll('.dpad-btn, .action-btn');
        
        buttons.forEach(btn => {
            const key = btn.dataset.key;
            if (!key) return;

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('active');
                simulateKeyEvent('keydown', key);
            });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                simulateKeyEvent('keyup', key);
            });

            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                btn.classList.remove('active');
                simulateKeyEvent('keyup', key);
            });
        });
    }

    function simulateKeyEvent(type, code) {
        const event = new KeyboardEvent(type, {
            code: code,
            key: code === 'Space' ? ' ' : code.replace('Arrow', '').toLowerCase(),
            bubbles: true,
            cancelable: true
        });
        window.dispatchEvent(event);
    }

    function getScale() {
        return scale;
    }

    return { init, getScale };
})();
