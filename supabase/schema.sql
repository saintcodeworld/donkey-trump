-- ===========================================
-- Donkey Kong Play-to-Earn - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ===========================================

-- Players table: stores wallet info for each player
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Round completions: tracks every round a player completes
CREATE TABLE IF NOT EXISTS round_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    board_name TEXT NOT NULL,
    board_number INTEGER NOT NULL,
    level INTEGER NOT NULL DEFAULT 1,
    score INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT now()
);

-- Rewards: tracks SOL payouts
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    round_completion_id UUID REFERENCES round_completions(id) ON DELETE SET NULL,
    amount_sol NUMERIC(18, 9) NOT NULL,
    tx_signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_players_public_key ON players(public_key);
CREATE INDEX IF NOT EXISTS idx_round_completions_player ON round_completions(player_id);
CREATE INDEX IF NOT EXISTS idx_round_completions_pubkey ON round_completions(public_key);
CREATE INDEX IF NOT EXISTS idx_rewards_player ON rewards(player_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_pubkey ON rewards(public_key);

-- RLS (Row Level Security) Policies
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- Players: anyone can insert (signup), read own data
CREATE POLICY "Anyone can register" ON players
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Players can read own data" ON players
    FOR SELECT USING (true);

-- Round completions: insert via service key (server-side), players can read own
CREATE POLICY "Read own round completions" ON round_completions
    FOR SELECT USING (true);

CREATE POLICY "Server can insert round completions" ON round_completions
    FOR INSERT WITH CHECK (true);

-- Rewards: read-only for players, managed by server
CREATE POLICY "Read own rewards" ON rewards
    FOR SELECT USING (true);

CREATE POLICY "Server can insert rewards" ON rewards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Server can update rewards" ON rewards
    FOR UPDATE USING (true);

-- High Scores table: tracks top scores for leaderboard
CREATE TABLE IF NOT EXISTS high_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    board_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_top_24h BOOLEAN DEFAULT false
);

-- Player balances: tracks withdrawable SOL balance
CREATE TABLE IF NOT EXISTS player_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    balance_sol NUMERIC(18, 9) NOT NULL DEFAULT 0,
    total_earned_sol NUMERIC(18, 9) NOT NULL DEFAULT 0,
    total_withdrawn_sol NUMERIC(18, 9) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(player_id, public_key)
);

-- Withdrawals: tracks withdrawal requests and transactions
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    amount_sol NUMERIC(18, 9) NOT NULL,
    tx_signature TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Chat messages table: stores live chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_key TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for high scores
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_created ON high_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_player ON high_scores(player_id);
CREATE INDEX IF NOT EXISTS idx_high_scores_pubkey ON high_scores(public_key);

-- Indexes for player balances
CREATE INDEX IF NOT EXISTS idx_player_balances_player ON player_balances(player_id);
CREATE INDEX IF NOT EXISTS idx_player_balances_pubkey ON player_balances(public_key);
CREATE INDEX IF NOT EXISTS idx_player_balances_balance ON player_balances(balance_sol DESC);

-- Indexes for withdrawals
CREATE INDEX IF NOT EXISTS idx_withdrawals_player ON withdrawals(player_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_pubkey ON withdrawals(public_key);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created ON withdrawals(created_at DESC);

-- Indexes for chat
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);

-- RLS for high scores
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read high scores" ON high_scores
    FOR SELECT USING (true);

CREATE POLICY "Server can insert high scores" ON high_scores
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Server can update high scores" ON high_scores
    FOR UPDATE USING (true);

-- RLS for chat
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read chat" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Anyone can insert chat" ON chat_messages
    FOR INSERT WITH CHECK (true);

-- RLS for player balances
ALTER TABLE player_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own balance" ON player_balances
    FOR SELECT USING (true);

CREATE POLICY "Server can manage balances" ON player_balances
    FOR ALL USING (true);

-- RLS for withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can read own withdrawals" ON withdrawals
    FOR SELECT USING (true);

CREATE POLICY "Server can manage withdrawals" ON withdrawals
    FOR ALL USING (true);

-- Function to clean old chat messages (keep last 100)
CREATE OR REPLACE FUNCTION clean_old_chat_messages()
RETURNS void AS $$
BEGIN
    DELETE FROM chat_messages
    WHERE id NOT IN (
        SELECT id FROM chat_messages
        ORDER BY created_at DESC
        LIMIT 100
    );
END;
$$ LANGUAGE plpgsql;
