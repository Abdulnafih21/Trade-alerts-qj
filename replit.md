# Crypto Trading Platform - Replit Setup

## Overview
This is a Next.js crypto trading platform imported from GitHub that provides real-time trading signals, portfolio management, and community features. The application uses Supabase for authentication and database services.

## Project Architecture
- **Frontend**: Next.js 15.2.4 with React 19
- **UI Framework**: Tailwind CSS with Radix UI components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts library
- **State Management**: React hooks

## Key Features
- Real-time trading signals and market data
- Interactive candlestick charts
- Portfolio dashboard and P&L tracking
- Strategy studio and backtesting
- Community hub for traders
- Alert system for trading notifications
- User authentication and profiles

## Development Setup
- **Port**: 5000 (configured for Replit proxy)
- **Host**: 0.0.0.0 to work with Replit's iframe preview
- **Environment**: All required Supabase secrets configured
- **Dependencies**: Installed with legacy peer deps to resolve React 19 conflicts

## Environment Variables
- `DATABASE_URL`: Supabase database connection
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## Deployment Configuration
- **Target**: Autoscale (stateless web application)
- **Build**: `npm run build`
- **Run**: `npm start`

## Recent Changes (September 13, 2025)
- Configured Next.js for Replit environment
- Set up Supabase integration with all required environment variables
- Resolved dependency conflicts with legacy peer deps
- Configured development workflow on port 5000
- Set up deployment configuration for production
- Successfully tested application startup and Supabase connection

## Current Status
✅ Development server running successfully
✅ All dependencies installed
✅ Supabase integration configured
✅ Deployment settings configured
✅ Ready for development and production use