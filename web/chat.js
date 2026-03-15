// ============================================================
// Donkey Kong JS - Chat Client with WebSocket
// ============================================================

const ChatClient = (() => {
    let ws = null;
    let publicKey = null;
    let reconnectTimer = null;
    let isOpen = false;

    const chatWidget = document.getElementById('chatWidget');
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');

    function init(userPublicKey) {
        publicKey = userPublicKey;
        setupUI();
        connect();
        loadRecentMessages();
    }

    function setupUI() {
        chatSend.addEventListener('click', sendMessage);
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    function show() {
        chatWidget.classList.remove('hidden');
        isOpen = true;
    }

    function hide() {
        chatWidget.classList.add('hidden');
        isOpen = false;
    }

    function connect() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('Chat WebSocket connected');
                if (reconnectTimer) {
                    clearTimeout(reconnectTimer);
                    reconnectTimer = null;
                }
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'chat' && data.data) {
                        addMessageToUI(data.data);
                    }
                } catch (e) {
                    console.error('Failed to parse chat message:', e);
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('Chat WebSocket disconnected');
                // Attempt to reconnect after 5 seconds
                if (!reconnectTimer) {
                    reconnectTimer = setTimeout(() => {
                        console.log('Attempting to reconnect...');
                        connect();
                    }, 5000);
                }
            };
        } catch (e) {
            console.error('Failed to create WebSocket:', e);
        }
    }

    async function loadRecentMessages() {
        try {
            const data = await GameAPI.getChatMessages();
            if (data.messages && data.messages.length > 0) {
                chatMessages.innerHTML = '';
                data.messages.forEach(msg => addMessageToUI(msg, false));
                scrollToBottom();
            }
        } catch (e) {
            console.error('Failed to load chat messages:', e);
        }
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message || !publicKey) return;

        // Send via WebSocket if connected
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'chat',
                publicKey: publicKey,
                message: message
            }));
        } else {
            // Fallback to HTTP API
            GameAPI.postChatMessage(publicKey, message)
                .then(data => {
                    if (data.message) {
                        addMessageToUI(data.message);
                    }
                })
                .catch(e => console.error('Failed to send message:', e));
        }

        chatInput.value = '';
    }

    function addMessageToUI(message, scroll = true) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';

        const walletDiv = document.createElement('div');
        walletDiv.className = 'chat-wallet';
        const wallet = message.public_key || 'Unknown';
        walletDiv.textContent = wallet.length > 16 ? 
            wallet.substring(0, 8) + '...' + wallet.substring(wallet.length - 4) : wallet;

        const textDiv = document.createElement('div');
        textDiv.className = 'chat-text';
        textDiv.textContent = message.message;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'chat-time';
        timeDiv.textContent = formatTime(message.created_at);

        msgDiv.appendChild(walletDiv);
        msgDiv.appendChild(textDiv);
        msgDiv.appendChild(timeDiv);

        chatMessages.appendChild(msgDiv);

        // Keep only last 50 messages in DOM
        while (chatMessages.children.length > 50) {
            chatMessages.removeChild(chatMessages.firstChild);
        }

        if (scroll) {
            scrollToBottom();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'just now';
        if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        return date.toLocaleDateString();
    }

    function disconnect() {
        if (ws) {
            ws.close();
            ws = null;
        }
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
    }

    return { init, disconnect, show, hide };
})();
