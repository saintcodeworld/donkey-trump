// ============================================================
// Donkey Kong JS - Tutorial & Onboarding System
// Guides new players through game mechanics and P2E features
// ============================================================

const Tutorial = (() => {
    let modal = null;
    let currentStep = 0;
    let hasSeenTutorial = false;

    const tutorialSteps = [
        {
            title: "WELCOME TO DONKEY TRUMP",
            content: "A classic arcade game where each completed round triggers a dev buy of 0.01 on coin!",
            image: "🎮"
        },
        {
            title: "HOW TO PLAY",
            content: "Use ARROW KEYS to move left/right and climb ladders. Press SPACE to jump over barrels and obstacles.",
            image: "⌨️"
        },
        {
            title: "OBJECTIVE",
            content: "Reach the top of each board to rescue Pauline. Avoid barrels, fireballs, and other hazards!",
            image: "🎯"
        },
        {
            title: "ROUND PASS = DEV BUY",
            content: "Each round pass automatically triggers a 0.01 dev buy on the coin. Play rounds to support the project!",
            image: "💰"
        },
        {
            title: "24-HOUR LEADERBOARD",
            content: "Top player in 24 hours gets recognition! Check the leaderboard to see your ranking and round passes.",
            image: "🏆"
        },
        {
            title: "YOUR ACCOUNT",
            content: "Your game account is stored securely in your browser. Click ACCOUNT (top-right) to view your stats and round passes.",
            image: "👛"
        },
        {
            title: "READY TO PLAY?",
            content: "Press P to pause anytime. Press ESC to return to menu. Good luck and have fun supporting the coin!",
            image: "🚀"
        }
    ];

    function init() {
        checkTutorialStatus();
        createModal();
        setupEventListeners();
    }

    function checkTutorialStatus() {
        hasSeenTutorial = localStorage.getItem('hasSeenTutorial') === 'true';
    }

    function createModal() {
        modal = document.createElement('div');
        modal.id = 'tutorialModal';
        modal.innerHTML = `
            <div id="tutorialModalContent">
                <div id="tutorialHeader">
                    <h3 id="tutorialTitle"></h3>
                    <button id="tutorialSkip">SKIP</button>
                </div>
                <div id="tutorialBody">
                    <div id="tutorialImage"></div>
                    <div id="tutorialText"></div>
                </div>
                <div id="tutorialFooter">
                    <div id="tutorialProgress"></div>
                    <div id="tutorialButtons">
                        <button id="tutorialPrev" style="display:none;">◄ BACK</button>
                        <button id="tutorialNext">NEXT ►</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function setupEventListeners() {
        const skipBtn = document.getElementById('tutorialSkip');
        const prevBtn = document.getElementById('tutorialPrev');
        const nextBtn = document.getElementById('tutorialNext');

        skipBtn.addEventListener('click', skip);
        prevBtn.addEventListener('click', previousStep);
        nextBtn.addEventListener('click', nextStep);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) skip();
        });

        document.addEventListener('keydown', (e) => {
            if (modal.style.display === 'flex') {
                if (e.code === 'ArrowRight' || e.code === 'Enter') nextStep();
                if (e.code === 'ArrowLeft') previousStep();
                if (e.code === 'Escape') skip();
            }
        });
    }

    function show() {
        currentStep = 0;
        modal.style.display = 'flex';
        renderStep();
    }

    function hide() {
        modal.style.display = 'none';
        markAsComplete();
    }

    function skip() {
        hide();
    }

    function nextStep() {
        if (currentStep < tutorialSteps.length - 1) {
            currentStep++;
            renderStep();
        } else {
            hide();
        }
    }

    function previousStep() {
        if (currentStep > 0) {
            currentStep--;
            renderStep();
        }
    }

    function renderStep() {
        const step = tutorialSteps[currentStep];
        
        document.getElementById('tutorialTitle').textContent = step.title;
        document.getElementById('tutorialImage').textContent = step.image;
        document.getElementById('tutorialText').textContent = step.content;
        
        // Update progress dots
        const progressHTML = tutorialSteps.map((_, i) => 
            `<span class="progress-dot ${i === currentStep ? 'active' : ''}"></span>`
        ).join('');
        document.getElementById('tutorialProgress').innerHTML = progressHTML;
        
        // Update buttons
        const prevBtn = document.getElementById('tutorialPrev');
        const nextBtn = document.getElementById('tutorialNext');
        
        prevBtn.style.display = currentStep > 0 ? 'inline-block' : 'none';
        nextBtn.textContent = currentStep === tutorialSteps.length - 1 ? "LET'S GO!" : 'NEXT ►';
    }

    function markAsComplete() {
        localStorage.setItem('hasSeenTutorial', 'true');
        hasSeenTutorial = true;
    }

    function shouldShowTutorial() {
        return !hasSeenTutorial;
    }

    function reset() {
        localStorage.removeItem('hasSeenTutorial');
        hasSeenTutorial = false;
    }

    return { init, show, hide, shouldShowTutorial, reset };
})();
