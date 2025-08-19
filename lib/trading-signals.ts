import { createServerClient } from "./supabase/server"
import { binanceAPI } from "./binance-api"

export interface TechnicalIndicators {
  rsi: number
  ema9: number
  ema21: number
  macd: { macd: number; signal: number; histogram: number }
  volume: number
  price: number
}

export interface TradingSignal {
  id?: string
  symbol: string
  signal_type: "LONG" | "SHORT" | "FLAT"
  confidence: number
  strategy_name: string
  entry_price: number
  stop_loss?: number
  take_profit?: number
  reasoning: string
  created_at?: string
}

class TradingSignalsEngine {
  private supabase: any = null

  constructor() {
    this.initializeSupabase()
  }

  private async initializeSupabase() {
    try {
      this.supabase = createServerClient()
      console.log("[v0] Supabase client initialized successfully")
    } catch (error) {
      console.error("[v0] Failed to initialize Supabase client:", error)
      this.supabase = null
    }
  }

  // Calculate RSI
  private calculateRSI(prices: number[], period = 14): number {
    if (prices.length < period + 1) return 50

    let gains = 0
    let losses = 0

    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }

    const avgGain = gains / period
    const avgLoss = losses / period
    const rs = avgGain / avgLoss
    return 100 - 100 / (1 + rs)
  }

  // Calculate EMA
  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1]

    const multiplier = 2 / (period + 1)
    let ema = prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period

    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * multiplier + ema * (1 - multiplier)
    }

    return ema
  }

  // Calculate MACD
  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)
    const macd = ema12 - ema26

    // Simplified signal line calculation
    const signal = macd * 0.8 // Approximation
    const histogram = macd - signal

    return { macd, signal, histogram }
  }

  // Get technical indicators for a symbol
  async getTechnicalIndicators(symbol: string): Promise<TechnicalIndicators | null> {
    try {
      const historicalData = await binanceAPI.getHistoricalData(symbol, "1h", 100)
      if (historicalData.length === 0) return null

      const prices = historicalData.map((d) => Number.parseFloat(d.close))
      const volumes = historicalData.map((d) => Number.parseFloat(d.volume))
      const currentPrice = prices[prices.length - 1]

      return {
        rsi: this.calculateRSI(prices),
        ema9: this.calculateEMA(prices, 9),
        ema21: this.calculateEMA(prices, 21),
        macd: this.calculateMACD(prices),
        volume: volumes[volumes.length - 1],
        price: currentPrice,
      }
    } catch (error) {
      console.error(`Error calculating indicators for ${symbol}:`, error)
      return null
    }
  }

  // Generate trading signal based on technical analysis
  async generateSignal(symbol: string): Promise<TradingSignal | null> {
    const indicators = await this.getTechnicalIndicators(symbol)
    if (!indicators) return null

    const { rsi, ema9, ema21, macd, price } = indicators

    // RSI Strategy
    if (rsi < 30 && ema9 > ema21 && macd.histogram > 0) {
      return {
        symbol,
        signal_type: "LONG",
        confidence: Math.min(95, 60 + (30 - rsi)),
        strategy_name: "RSI Oversold + EMA Bullish",
        entry_price: price,
        stop_loss: price * 0.97,
        take_profit: price * 1.06,
        reasoning: `RSI oversold (${rsi.toFixed(1)}), EMA9 > EMA21, MACD bullish`,
      }
    }

    if (rsi > 70 && ema9 < ema21 && macd.histogram < 0) {
      return {
        symbol,
        signal_type: "SHORT",
        confidence: Math.min(95, 60 + (rsi - 70)),
        strategy_name: "RSI Overbought + EMA Bearish",
        entry_price: price,
        stop_loss: price * 1.03,
        take_profit: price * 0.94,
        reasoning: `RSI overbought (${rsi.toFixed(1)}), EMA9 < EMA21, MACD bearish`,
      }
    }

    // EMA Crossover Strategy
    if (ema9 > ema21 * 1.002 && macd.macd > macd.signal) {
      return {
        symbol,
        signal_type: "LONG",
        confidence: 75,
        strategy_name: "EMA Crossover Bullish",
        entry_price: price,
        stop_loss: price * 0.98,
        take_profit: price * 1.04,
        reasoning: "EMA9 crossed above EMA21, MACD bullish crossover",
      }
    }

    return {
      symbol,
      signal_type: "FLAT",
      confidence: 50,
      strategy_name: "No Clear Signal",
      entry_price: price,
      reasoning: "Mixed signals, waiting for clearer trend",
    }
  }

  // Save signal to database
  async saveSignal(signal: TradingSignal, userId?: string): Promise<boolean> {
    try {
      if (!this.supabase) {
        console.warn("[v0] Supabase client not available, cannot save signal")
        return false
      }

      const { error } = await this.supabase.from("trading_signals").insert({
        symbol: signal.symbol,
        signal_type: signal.signal_type,
        confidence: signal.confidence,
        strategy_name: signal.strategy_name,
        entry_price: signal.entry_price,
        stop_loss: signal.stop_loss,
        take_profit: signal.take_profit,
        reasoning: signal.reasoning,
        user_id: userId,
      })

      return !error
    } catch (error) {
      console.error("Error saving signal:", error)
      return false
    }
  }

  // Get recent signals from database
  async getRecentSignals(limit = 50): Promise<TradingSignal[]> {
    try {
      console.log("[v0] Fetching recent signals from database")

      if (!this.supabase) {
        console.warn("[v0] Supabase client not initialized, using demo data")
        return this.getDemoSignals(limit)
      }

      const { data, error } = await this.supabase
        .from("trading_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (error) {
        console.error("[v0] Supabase query error:", error)
        console.log("[v0] Falling back to demo data")
        return this.getDemoSignals(limit)
      }

      console.log("[v0] Successfully fetched signals:", data?.length || 0)
      return data || []
    } catch (error) {
      console.error("[v0] Error fetching signals:", error)
      console.log("[v0] Using demo data as fallback")
      return this.getDemoSignals(limit)
    }
  }

  private getDemoSignals(limit = 50): TradingSignal[] {
    const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "XRPUSDT"]
    const strategies = ["RSI Oversold + EMA Bullish", "EMA Crossover Bullish", "MACD Divergence"]
    const signalTypes: ("LONG" | "SHORT" | "FLAT")[] = ["LONG", "SHORT", "FLAT"]

    return Array.from({ length: Math.min(limit, 20) }, (_, i) => ({
      id: `demo-${i}`,
      symbol: symbols[i % symbols.length],
      signal_type: signalTypes[i % signalTypes.length],
      confidence: Math.floor(Math.random() * 40) + 60,
      strategy_name: strategies[i % strategies.length],
      entry_price: Math.random() * 100000 + 20000,
      stop_loss: Math.random() * 95000 + 19000,
      take_profit: Math.random() * 110000 + 21000,
      reasoning: `Demo signal ${i + 1} - technical analysis indicates ${signalTypes[i % signalTypes.length]} position`,
      created_at: new Date(Date.now() - i * 300000).toISOString(),
    }))
  }
}

export const tradingSignalsEngine = new TradingSignalsEngine()
