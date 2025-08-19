export const config = {
  // API Configuration
  binance: {
    baseUrl: "https://api.binance.com/api/v3",
    wsUrl: "wss://stream.binance.com:9443/ws",
    rateLimits: {
      requests: 1200, // per minute
      weight: 6000, // per minute
    },
  },

  // WebSocket Configuration
  websocket: {
    maxReconnectAttempts: 3,
    reconnectDelay: 5000,
    heartbeatInterval: 30000,
  },

  // Trading Configuration
  trading: {
    maxSignalsPerHour: 10,
    defaultStopLoss: 0.03, // 3%
    defaultTakeProfit: 0.06, // 6%
    minConfidence: 60,
  },

  // Database Configuration
  database: {
    maxRetries: 3,
    retryDelay: 1000,
  },

  // Feature Flags
  features: {
    realTimeSignals: true,
    backtesting: true,
    communityFeatures: true,
    advancedCharts: true,
  },

  // Environment Checks
  isDevelopment: process.env.NODE_ENV === "development",
  isProduction: process.env.NODE_ENV === "production",

  // Required Environment Variables
  requiredEnvVars: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"] as const,
}

// Validate environment variables
export function validateEnvironment(): { isValid: boolean; missing: string[] } {
  const missing = config.requiredEnvVars.filter((envVar) => !process.env[envVar])

  return {
    isValid: missing.length === 0,
    missing,
  }
}

// Get environment-specific configuration
export function getEnvironmentConfig() {
  const envValidation = validateEnvironment()

  if (!envValidation.isValid) {
    console.warn("[v0] Missing environment variables:", envValidation.missing)
  }

  return {
    ...config,
    environment: {
      isValid: envValidation.isValid,
      missing: envValidation.missing,
    },
  }
}
