export class TradingPlatformError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>,
  ) {
    super(message)
    this.name = "TradingPlatformError"
  }
}

export const ErrorCodes = {
  WEBSOCKET_CONNECTION_FAILED: "WEBSOCKET_CONNECTION_FAILED",
  API_RATE_LIMIT_EXCEEDED: "API_RATE_LIMIT_EXCEEDED",
  DATABASE_CONNECTION_FAILED: "DATABASE_CONNECTION_FAILED",
  INVALID_TRADING_SIGNAL: "INVALID_TRADING_SIGNAL",
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
} as const

export function handleApiError(error: unknown, context?: string): TradingPlatformError {
  console.error(`[v0] API Error in ${context}:`, error)

  if (error instanceof TradingPlatformError) {
    return error
  }

  if (error instanceof Error) {
    return new TradingPlatformError(error.message, ErrorCodes.DATABASE_CONNECTION_FAILED, {
      originalError: error.message,
      context,
    })
  }

  return new TradingPlatformError("An unexpected error occurred", "UNKNOWN_ERROR", { context })
}

export function logError(error: TradingPlatformError | Error, additionalContext?: Record<string, any>) {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  }

  if (error instanceof TradingPlatformError) {
    errorData.code = error.code
    errorData.context = error.context
  }

  console.error("[v0] Error logged:", errorData)

  // In production, you would send this to your error tracking service
  // Example: Sentry.captureException(error, { extra: errorData })
}
