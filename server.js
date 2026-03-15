require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } = require('@solana/web3.js');
const { createClient } = require('@supabase/supabase-js');
const bs58 = require('bs58');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

// ---- Config ----
const PORT = process.env.PORT || 8080;
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PUMPFUN_TOKEN_ADDRESS = process.env.PUMPFUN_TOKEN_ADDRESS || '';
const PUMPFUN_BUY_AMOUNT_SOL = parseFloat(process.env.PUMPFUN_BUY_AMOUNT_SOL || '0.01');

// ---- Supabase ----
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// ---- Solana Connection ----
const connection = new Connection(RPC_URL, 'confirmed');

function getDevWallet() {
    const key = process.env.DEVWALLET_PRIVATE_KEY;
    if (!key) throw new Error('DEVWALLET_PRIVATE_KEY not set');
    const decoded = bs58.decode(key);
    return Keypair.fromSecretKey(decoded);
}

// ---- PumpFun Token Buy ----
async function buyPumpFunToken() {
    try {
        console.log('=== Starting PumpFun Token Purchase ===');
        console.log('Token Address:', PUMPFUN_TOKEN_ADDRESS);
        console.log('Buy Amount:', PUMPFUN_BUY_AMOUNT_SOL, 'SOL');
        
        if (!PUMPFUN_TOKEN_ADDRESS) {
            console.warn('PUMPFUN_TOKEN_ADDRESS not set, skipping buy');
            return null;
        }

        // Use dev wallet from .env to buy tokens
        console.log('Getting dev wallet...');
        const devWallet = getDevWallet();
        console.log('Dev wallet public key:', devWallet.publicKey.toBase58());

        const requestBody = {
            publicKey: devWallet.publicKey.toBase58(),
            action: 'buy',
            mint: PUMPFUN_TOKEN_ADDRESS,
            denominatedInSol: 'true',
            amount: PUMPFUN_BUY_AMOUNT_SOL,
            slippage: 15,
            priorityFee: 0.0005,
            pool: 'pump'
        };
        console.log('PumpPortal request:', JSON.stringify(requestBody, null, 2));

        console.log('Calling PumpPortal API...');
        const response = await fetch('https://pumpportal.fun/api/trade-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        console.log('PumpPortal response status:', response.status);
        
        if (!response.ok) {
            const errText = await response.text();
            console.error('PumpPortal error response:', errText);
            throw new Error(`PumpPortal API error: ${response.status} - ${errText}`);
        }

        console.log('Parsing transaction...');
        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        
        console.log('Signing transaction...');
        tx.sign([devWallet]);

        console.log('Sending transaction to Solana...');
        const txSignature = await connection.sendTransaction(tx, {
            skipPreflight: false,
            preflightCommitment: 'confirmed'
        });

        console.log(`✅ PumpFun buy executed: ${PUMPFUN_BUY_AMOUNT_SOL} SOL -> ${PUMPFUN_TOKEN_ADDRESS}`);
        console.log(`Transaction signature: ${txSignature}`);
        console.log('=== PumpFun Purchase Complete ===');
        
        return { txSignature, amount: PUMPFUN_BUY_AMOUNT_SOL, token: PUMPFUN_TOKEN_ADDRESS };
    } catch (e) {
        console.error('❌ PumpFun buy error:', e.message);
        console.error('Full error:', e);
        return null;
    }
}

// ---- Static Files (no-cache) ----
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Redirect root to /web/
app.get('/', (req, res) => {
    res.redirect('/web/');
});

app.use('/', express.static(path.join(__dirname)));
app.use('/web', express.static(path.join(__dirname, 'web')));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// ---- API Routes ----

// Register player
app.post('/api/register', async (req, res) => {
    try {
        const { publicKey } = req.body;
        if (!publicKey) return res.status(400).json({ error: 'publicKey required' });

        // Validate it's a real Solana public key
        try { new PublicKey(publicKey); } catch {
            return res.status(400).json({ error: 'Invalid Solana public key' });
        }

        // Upsert player
        const { data, error } = await supabase
            .from('players')
            .upsert({ public_key: publicKey }, { onConflict: 'public_key' })
            .select()
            .single();

        if (error) throw error;
        res.json({ player: data });
    } catch (e) {
        console.error('Register error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Record round completion + trigger reward
app.post('/api/round-complete', async (req, res) => {
    try {
        const { publicKey, boardName, boardNumber, level, score } = req.body;
        if (!publicKey || !boardName) {
            return res.status(400).json({ error: 'publicKey and boardName required' });
        }

        // Validate public key
        let playerPubKey;
        try { playerPubKey = new PublicKey(publicKey); } catch {
            return res.status(400).json({ error: 'Invalid Solana public key' });
        }

        // Get player
        const { data: player, error: playerErr } = await supabase
            .from('players')
            .select('id')
            .eq('public_key', publicKey)
            .single();

        if (playerErr || !player) {
            return res.status(404).json({ error: 'Player not registered' });
        }

        // Record round completion
        const { data: round, error: roundErr } = await supabase
            .from('round_completions')
            .insert({
                player_id: player.id,
                public_key: publicKey,
                board_name: boardName,
                board_number: boardNumber || 1,
                level: level || 1,
                score: score || 0
            })
            .select()
            .single();

        if (roundErr) throw roundErr;

        // Trigger PumpFun token buy on round completion using dev wallet
        let buyResult = null;
        if (PUMPFUN_TOKEN_ADDRESS) {
            buyResult = await buyPumpFunToken();
        }

        console.log(`Round completed by ${publicKey} | Board: ${boardName} | PumpFun buy: ${buyResult ? 'success' : 'skipped/failed'}`);

        res.json({
            round: round,
            pumpfunBuy: buyResult
        });
    } catch (e) {
        console.error('Round complete error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get player stats
app.get('/api/player/:publicKey', async (req, res) => {
    try {
        const { publicKey } = req.params;

        const { data: player } = await supabase
            .from('players')
            .select('*')
            .eq('public_key', publicKey)
            .single();

        if (!player) return res.status(404).json({ error: 'Player not found' });

        const { data: rounds } = await supabase
            .from('round_completions')
            .select('*')
            .eq('public_key', publicKey)
            .order('completed_at', { ascending: false })
            .limit(50);

        res.json({
            player,
            rounds: rounds || [],
            totalRounds: (rounds || []).length
        });
    } catch (e) {
        console.error('Player stats error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get config (public-safe values only)
app.get('/api/config', (req, res) => {
    res.json({
        network: RPC_URL.includes('devnet') ? 'devnet' : RPC_URL.includes('mainnet') ? 'mainnet-beta' : 'custom'
    });
});

// Submit high score
app.post('/api/high-score', async (req, res) => {
    try {
        const { publicKey, score, level, boardNumber } = req.body;
        if (!publicKey || score === undefined) {
            return res.status(400).json({ error: 'publicKey and score required' });
        }

        // Validate public key
        try { new PublicKey(publicKey); } catch {
            return res.status(400).json({ error: 'Invalid Solana public key' });
        }

        // Get player
        const { data: player } = await supabase
            .from('players')
            .select('id')
            .eq('public_key', publicKey)
            .single();

        if (!player) {
            return res.status(404).json({ error: 'Player not registered' });
        }

        // Insert high score
        const { data: highScore, error } = await supabase
            .from('high_scores')
            .insert({
                player_id: player.id,
                public_key: publicKey,
                score: score,
                level: level || 1,
                board_number: boardNumber || 1
            })
            .select()
            .single();

        if (error) throw error;

        res.json({ highScore });
    } catch (e) {
        console.error('High score error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get leaderboard (top 10 all-time)
app.get('/api/leaderboard', async (req, res) => {
    try {
        const { data: scores, error } = await supabase
            .from('high_scores')
            .select('public_key, score, level, created_at')
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        res.json({ leaderboard: scores || [] });
    } catch (e) {
        console.error('Leaderboard error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get top player in last 24 hours
app.get('/api/leaderboard/24h', async (req, res) => {
    try {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        
        const { data: scores, error } = await supabase
            .from('high_scores')
            .select('public_key, score, level, created_at')
            .gte('created_at', twentyFourHoursAgo)
            .order('score', { ascending: false })
            .limit(10);

        if (error) throw error;

        res.json({ 
            leaderboard: scores || [],
            timeRemaining: getTimeRemaining24h()
        });
    } catch (e) {
        console.error('24h leaderboard error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Get recent chat messages
app.get('/api/chat/messages', async (req, res) => {
    try {
        const { data: messages, error } = await supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        res.json({ messages: (messages || []).reverse() });
    } catch (e) {
        console.error('Chat messages error:', e);
        res.status(500).json({ error: e.message });
    }
});

// Post chat message
app.post('/api/chat/message', async (req, res) => {
    try {
        const { publicKey, message } = req.body;
        if (!publicKey || !message) {
            return res.status(400).json({ error: 'publicKey and message required' });
        }

        // Validate public key
        try { new PublicKey(publicKey); } catch {
            return res.status(400).json({ error: 'Invalid Solana public key' });
        }

        // Sanitize message
        const sanitized = message.trim().substring(0, 200);
        if (!sanitized) {
            return res.status(400).json({ error: 'Message cannot be empty' });
        }

        // Insert message
        const { data: chatMsg, error } = await supabase
            .from('chat_messages')
            .insert({
                public_key: publicKey,
                message: sanitized
            })
            .select()
            .single();

        if (error) throw error;

        // Broadcast to all WebSocket clients
        broadcastChatMessage(chatMsg);

        res.json({ message: chatMsg });
    } catch (e) {
        console.error('Chat message error:', e);
        res.status(500).json({ error: e.message });
    }
});

function getTimeRemaining24h() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return { hours, minutes };
}

// ---- WebSocket Chat Server ----
wss.on('connection', (ws) => {
    console.log('New WebSocket client connected');

    ws.on('message', async (data) => {
        try {
            const payload = JSON.parse(data);
            
            if (payload.type === 'chat') {
                const { publicKey, message } = payload;
                if (!publicKey || !message) return;

                // Validate public key
                try { new PublicKey(publicKey); } catch { return; }

                // Sanitize message
                const sanitized = message.trim().substring(0, 200);
                if (!sanitized) return;

                // Insert into database
                const { data: chatMsg, error } = await supabase
                    .from('chat_messages')
                    .insert({
                        public_key: publicKey,
                        message: sanitized
                    })
                    .select()
                    .single();

                if (!error && chatMsg) {
                    broadcastChatMessage(chatMsg);
                }
            }
        } catch (e) {
            console.error('WebSocket message error:', e);
        }
    });

    ws.on('close', () => {
        console.log('WebSocket client disconnected');
    });
});

function broadcastChatMessage(message) {
    const payload = JSON.stringify({
        type: 'chat',
        data: message
    });
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(payload);
        }
    });
}

// ---- Start Server ----
server.listen(PORT, () => {
    console.log(`Donkey Kong P2E server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
    console.log(`Solana RPC: ${RPC_URL}`);
    console.log(`PumpFun token: ${PUMPFUN_TOKEN_ADDRESS || 'NOT SET'}`);
    console.log(`PumpFun buy amount: ${PUMPFUN_BUY_AMOUNT_SOL} SOL`);
});
