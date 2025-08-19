-- Add performance indexes for the trading platform
-- Adding database indexes for better query performance

-- Index for trading signals queries
CREATE INDEX IF NOT EXISTS idx_trading_signals_symbol_created ON trading_signals(symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_user_created ON trading_signals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trading_signals_strategy ON trading_signals(strategy_name);
CREATE INDEX IF NOT EXISTS idx_trading_signals_type ON trading_signals(signal_type);

-- Index for market data queries
CREATE INDEX IF NOT EXISTS idx_market_data_symbol_timestamp ON market_data(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_market_data_timeframe ON market_data(timeframe);

-- Index for backtest results
CREATE INDEX IF NOT EXISTS idx_backtest_results_user_created ON backtest_results(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backtest_results_strategy ON backtest_results(strategy_name);
CREATE INDEX IF NOT EXISTS idx_backtest_results_symbol ON backtest_results(symbol);

-- Add RLS (Row Level Security) policies for multi-tenant support
ALTER TABLE trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE backtest_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own signals (if user_id is set)
CREATE POLICY "Users can view own signals" ON trading_signals
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert own signals" ON trading_signals
    FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Policy: Users can only see their own backtest results
CREATE POLICY "Users can view own backtest results" ON backtest_results
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own backtest results" ON backtest_results
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Market data is public (read-only for all users)
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Market data is public" ON market_data
    FOR SELECT USING (true);
