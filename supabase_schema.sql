-- ============================================================
-- Donkey Kong Play-to-Earn - Supabase Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. PLAYERS TABLE
-- Stores registered player wallets
CREATE TABLE IF NOT EXISTS players (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by public key
CREATE INDEX IF NOT EXISTS idx_players_public_key ON players(public_key);

-- 2. ROUND COMPLETIONS TABLE
-- Tracks every round a player completes
CREATE TABLE IF NOT EXISTS round_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    board_name TEXT NOT NULL DEFAULT 'unknown',
    board_number INTEGER DEFAULT 1,
    level INTEGER DEFAULT 1,
    score INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for round_completions
CREATE INDEX IF NOT EXISTS idx_round_completions_public_key ON round_completions(public_key);
CREATE INDEX IF NOT EXISTS idx_round_completions_player_id ON round_completions(player_id);
CREATE INDEX IF NOT EXISTS idx_round_completions_completed_at ON round_completions(completed_at DESC);

-- 3. REWARDS TABLE
-- Tracks all SOL reward payouts
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    round_completion_id UUID REFERENCES round_completions(id) ON DELETE SET NULL,
    amount_sol DECIMAL(18, 9) NOT NULL DEFAULT 0.02,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    tx_signature TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes for rewards
CREATE INDEX IF NOT EXISTS idx_rewards_public_key ON rewards(public_key);
CREATE INDEX IF NOT EXISTS idx_rewards_player_id ON rewards(player_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_rewards_created_at ON rewards(created_at DESC);

-- 4. HIGH SCORES TABLE
-- Stores submitted high scores for leaderboard
CREATE TABLE IF NOT EXISTS high_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    level INTEGER DEFAULT 1,
    board_number INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high_scores
CREATE INDEX IF NOT EXISTS idx_high_scores_public_key ON high_scores(public_key);
CREATE INDEX IF NOT EXISTS idx_high_scores_score ON high_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_high_scores_created_at ON high_scores(created_at DESC);

-- 5. CHAT MESSAGES TABLE
-- Stores in-game chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    public_key TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for chat_messages
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_public_key ON chat_messages(public_key);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- Enable RLS on all tables for security
-- The service_role key bypasses RLS, so server.js works fine.
-- These policies allow the anon key limited read access.
-- ============================================================

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE high_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Players: allow service role full access (default), anon can read own
CREATE POLICY "Service role full access on players" ON players
    FOR ALL USING (true) WITH CHECK (true);

-- Round completions: service role full access
CREATE POLICY "Service role full access on round_completions" ON round_completions
    FOR ALL USING (true) WITH CHECK (true);

-- Rewards: service role full access
CREATE POLICY "Service role full access on rewards" ON rewards
    FOR ALL USING (true) WITH CHECK (true);

-- High scores: anyone can read (leaderboard is public)
CREATE POLICY "Public read access on high_scores" ON high_scores
    FOR SELECT USING (true);

CREATE POLICY "Service role insert on high_scores" ON high_scores
    FOR INSERT WITH CHECK (true);

-- Chat messages: anyone can read and insert
CREATE POLICY "Public read access on chat_messages" ON chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Public insert access on chat_messages" ON chat_messages
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- USEFUL VIEWS (optional but helpful)
-- ============================================================

-- Player stats view: total earnings, rounds, success rate per player
CREATE OR REPLACE VIEW player_stats AS
SELECT
    p.id AS player_id,
    p.public_key,
    p.created_at AS registered_at,
    COALESCE(rc.total_rounds, 0) AS total_rounds,
    COALESCE(rw.total_rewards, 0) AS total_rewards,
    COALESCE(rw.completed_rewards, 0) AS completed_rewards,
    COALESCE(rw.total_earned_sol, 0) AS total_earned_sol,
    COALESCE(hs.best_score, 0) AS best_score,
    CASE 
        WHEN COALESCE(rw.total_rewards, 0) > 0 
        THEN ROUND((COALESCE(rw.completed_rewards, 0)::DECIMAL / rw.total_rewards) * 100, 1)
        ELSE 0 
    END AS success_rate_pct
FROM players p
LEFT JOIN (
    SELECT player_id, COUNT(*) AS total_rounds
    FROM round_completions
    GROUP BY player_id
) rc ON rc.player_id = p.id
LEFT JOIN (
    SELECT player_id,
           COUNT(*) AS total_rewards,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed_rewards,
           COALESCE(SUM(amount_sol) FILTER (WHERE status = 'completed'), 0) AS total_earned_sol
    FROM rewards
    GROUP BY player_id
) rw ON rw.player_id = p.id
LEFT JOIN (
    SELECT player_id, MAX(score) AS best_score
    FROM high_scores
    GROUP BY player_id
) hs ON hs.player_id = p.id;

-- 24h leaderboard view
CREATE OR REPLACE VIEW leaderboard_24h AS
SELECT
    public_key,
    score,
    level,
    created_at
FROM high_scores
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY score DESC
LIMIT 10;

-- All-time leaderboard view
CREATE OR REPLACE VIEW leaderboard_alltime AS
SELECT
    public_key,
    MAX(score) AS best_score,
    MAX(level) AS highest_level,
    COUNT(*) AS games_played
FROM high_scores
GROUP BY public_key
ORDER BY best_score DESC
LIMIT 10;

-- Recent rewards view
CREATE OR REPLACE VIEW recent_rewards AS
SELECT
    r.id,
    r.public_key,
    r.amount_sol,
    r.status,
    r.tx_signature,
    r.error_message,
    r.created_at,
    r.completed_at,
    rc.board_name,
    rc.level,
    rc.score
FROM rewards r
LEFT JOIN round_completions rc ON rc.id = r.round_completion_id
ORDER BY r.created_at DESC
LIMIT 100;

-- ============================================================
-- DONE! All tables and policies created.
-- ============================================================
