// Binance API integration for live market data
export interface CandlestickData {
  symbol: string
  openTime: number
  closeTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  trades: number
}

export interface TickerData {
  symbol: string
  price: string
  priceChange: string
  priceChangePercent: string
  volume: string
}

class BinanceAPI {
  private baseURL = "https://api.binance.com/api/v3"
  private wsURL = "wss://stream.binance.com:9443/ws"
  private wsConnections: Map<string, WebSocket> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 3
  private reconnectDelay = 5000

  // Get current price for a symbol
  async getCurrentPrice(symbol: string): Promise<TickerData | null> {
    try {
      const response = await fetch(`${this.baseURL}/ticker/24hr?symbol=${symbol}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error(`Error fetching price for ${symbol}:`, error)
      return null
    }
  }

  // Get historical candlestick data
  async getHistoricalData(symbol: string, interval = "1h", limit = 500): Promise<CandlestickData[]> {
    try {
      const response = await fetch(`${this.baseURL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

      const data = await response.json()
      return data.map((candle: any[]) => ({
        symbol,
        openTime: candle[0],
        closeTime: candle[6],
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5],
        trades: candle[8],
      }))
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error)
      return []
    }
  }

  // Get multiple symbols data
  async getMultipleSymbolsData(symbols: string[]): Promise<TickerData[]> {
    try {
      const symbolsParam = symbols.map((s) => `"${s}"`).join(",")
      const response = await fetch(`${this.baseURL}/ticker/24hr?symbols=[${symbolsParam}]`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      return await response.json()
    } catch (error) {
      console.error("Error fetching multiple symbols data:", error)
      return []
    }
  }

  subscribeToPrice(symbol: string, callback: (data: any) => void): () => void {
    if (typeof window === "undefined") return () => {}

    const streamName = `${symbol.toLowerCase()}@ticker`
    const wsUrl = `${this.wsURL}/${streamName}`

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          console.log(`[v0] WebSocket connected for ${symbol}`)
          this.reconnectAttempts.set(symbol, 0)
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            callback({
              symbol: data.s,
              price: data.c,
              priceChange: data.P,
              volume: data.v,
            })
          } catch (parseError) {
            console.error(`[v0] Error parsing WebSocket data for ${symbol}:`, parseError)
          }
        }

        ws.onerror = (error) => {
          console.error(`[v0] WebSocket error for ${symbol}:`, error)
          // Don't attempt reconnection on error, let onclose handle it
        }

        ws.onclose = (event) => {
          console.log(`[v0] WebSocket closed for ${symbol}, code: ${event.code}, reason: ${event.reason}`)
          this.wsConnections.delete(symbol)

          // Attempt reconnection if not manually closed
          if (event.code !== 1000) {
            const attempts = this.reconnectAttempts.get(symbol) || 0
            if (attempts < this.maxReconnectAttempts) {
              this.reconnectAttempts.set(symbol, attempts + 1)
              console.log(
                `[v0] Attempting to reconnect WebSocket for ${symbol} (attempt ${attempts + 1}/${this.maxReconnectAttempts})`,
              )
              setTimeout(connectWebSocket, this.reconnectDelay)
            } else {
              console.error(`[v0] Max reconnection attempts reached for ${symbol}`)
            }
          }
        }

        this.wsConnections.set(symbol, ws)
      } catch (error) {
        console.error(`[v0] Failed to create WebSocket connection for ${symbol}:`, error)
      }
    }

    connectWebSocket()

    // Return cleanup function
    return () => {
      const ws = this.wsConnections.get(symbol)
      if (ws) {
        ws.close(1000, "Manual close")
        this.wsConnections.delete(symbol)
        this.reconnectAttempts.delete(symbol)
      }
    }
  }

  // Close all WebSocket connections
  closeAllConnections() {
    this.wsConnections.forEach((ws, symbol) => {
      ws.close(1000, "Closing all connections")
      this.reconnectAttempts.delete(symbol)
    })
    this.wsConnections.clear()
  }

  getConnectionStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {}
    this.wsConnections.forEach((ws, symbol) => {
      status[symbol] = ws.readyState === WebSocket.OPEN
    })
    return status
  }
}

export const binanceAPI = new BinanceAPI()

// Popular trading pairs
export const POPULAR_SYMBOLS = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "ADAUSDT", "SOLUSDT", "XRPUSDT", "DOTUSDT", "DOGEUSDT"]
