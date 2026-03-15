// ============================================================
// Donkey Kong JS - Transaction History UI
// Displays player earnings, rewards, and transaction history
// ============================================================

const TransactionHistory = (() => {
    let modal = null;
    let currentWallet = null;

    function init() {
        createModal();
        setupEventListeners();
    }

    function createModal() {
        modal = document.createElement('div');
        modal.id = 'transactionModal';
        modal.innerHTML = `
            <div id="transactionModalContent">
                <div id="transactionHeader">
                    <h3>GAME HISTORY</h3>
                    <button id="transactionClose">✕</button>
                </div>
                <div id="transactionStats">
                    <div class="stat-box">
                        <div class="stat-label">ROUNDS PLAYED</div>
                        <div class="stat-value" id="totalRounds">0</div>
                    </div>
                </div>
                <div id="transactionList"></div>
                <div id="transactionFooter">
                    <button id="refreshTransactions">REFRESH</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    function setupEventListeners() {
        const closeBtn = document.getElementById('transactionClose');
        const refreshBtn = document.getElementById('refreshTransactions');

        closeBtn.addEventListener('click', hide);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) hide();
        });

        refreshBtn.addEventListener('click', () => {
            if (currentWallet) loadTransactions(currentWallet);
        });
    }

    async function show(publicKey) {
        currentWallet = publicKey;
        modal.style.display = 'flex';
        await loadTransactions(publicKey);
    }

    function hide() {
        modal.style.display = 'none';
    }

    async function loadTransactions(publicKey) {
        const listEl = document.getElementById('transactionList');
        listEl.innerHTML = '<div class="tx-loading">LOADING...</div>';

        try {
            const data = await GameAPI.getPlayerStats(publicKey);
            
            document.getElementById('totalRounds').textContent = data.totalRounds || 0;

            displayRounds(data.rounds || []);
        } catch (e) {
            console.error('Failed to load transactions:', e);
            listEl.innerHTML = '<div class="tx-error">Failed to load data. Please try again.</div>';
        }
    }

    function displayRounds(rounds) {
        const listEl = document.getElementById('transactionList');
        
        if (rounds.length === 0) {
            listEl.innerHTML = '<div class="tx-empty">No rounds completed yet. Start playing!</div>';
            return;
        }

        listEl.innerHTML = rounds.map(round => {
            const date = new Date(round.completed_at);
            
            return `
                <div class="tx-item">
                    <div class="tx-item-header">
                        <span class="tx-board">${round.board_name.toUpperCase()}</span>
                        <span class="tx-score">${round.score} pts</span>
                    </div>
                    <div class="tx-item-details">
                        <div class="tx-date">${formatDate(date)}</div>
                        <div class="tx-level">Level ${round.level} • Board ${round.board_number}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return date.toLocaleDateString();
    }

    return { init, show, hide };
})();
