// ============================================================
// Donkey Kong JS - Backend API Client
// Handles player registration, round completion, and rewards
// ============================================================

const GameAPI = (() => {
    const BASE_URL = window.location.origin;

    async function request(endpoint, options = {}) {
        const res = await fetch(BASE_URL + endpoint, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'API request failed');
        return data;
    }

    // Register player with their public key
    async function registerPlayer(publicKey) {
        return request('/api/register', {
            method: 'POST',
            body: JSON.stringify({ publicKey })
        });
    }

    // Report round completion and trigger reward payout
    async function roundComplete(publicKey, boardName, boardNumber, level, score) {
        return request('/api/round-complete', {
            method: 'POST',
            body: JSON.stringify({ publicKey, boardName, boardNumber, level, score })
        });
    }

    // Get player stats (rounds, rewards, total earned)
    async function getPlayerStats(publicKey) {
        return request('/api/player/' + encodeURIComponent(publicKey));
    }

    // Get server config (reward amount, network)
    async function getConfig() {
        return request('/api/config');
    }

    // Submit high score
    async function submitHighScore(publicKey, score, level, boardNumber) {
        return request('/api/high-score', {
            method: 'POST',
            body: JSON.stringify({ publicKey, score, level, boardNumber })
        });
    }

    // Get all-time leaderboard
    async function getLeaderboard() {
        return request('/api/leaderboard');
    }

    // Get 24-hour leaderboard
    async function getLeaderboard24h() {
        return request('/api/leaderboard/24h');
    }

    // Get chat messages
    async function getChatMessages() {
        return request('/api/chat/messages');
    }

    // Post chat message
    async function postChatMessage(publicKey, message) {
        return request('/api/chat/message', {
            method: 'POST',
            body: JSON.stringify({ publicKey, message })
        });
    }

    return { 
        registerPlayer, 
        roundComplete, 
        getPlayerStats, 
        getConfig,
        submitHighScore,
        getLeaderboard,
        getLeaderboard24h,
        getChatMessages,
        postChatMessage
    };
})();
