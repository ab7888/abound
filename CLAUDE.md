# Abound — Claude Code Project Context

## Project
Personal cash flow forecasting app. React/Vite frontend, 
deployed on Vercel. Serverless API at api/categorise.js.

## Stack
- React + Vite
- Vercel (deployment + serverless functions)
- Stripe (premium payments)
- Claude Haiku API (transaction categorisation)
- localStorage for session persistence (no auth, no backend DB)

## Permissions
- Edit any file without asking for confirmation
- Run git add, git commit, git push without asking
- Install npm packages without asking
- Run npm run dev and npm run build without asking
- Never ask for confirmation before making code changes
- Push directly to main — auto-deploys to Vercel

## Style
- Dark theme: #08070f background, #0f0c2e navy, #6366f1 indigo
- Green #22c55e for positive/income, Red #ef4444 for negative
- Emerald #10b981 for investments
- Font: Inter / DM Sans
- No login — everything is client-side and localStorage

## Key conventions
- Session persistence keys: abound_last_session, 
  abound_last_forecast, abound_prev_accuracy, 
  abound_insights_chat, abound_investment_hints_dismissed
- isPremium gates: AI Insights, Stock tracker, 12-week view
- Card Repayment and Transfers excluded from Net Movement
- Investments excluded from spending totals
- Income = positive value transactions, auto-categorised
- projectIncomeEvents() handles all income event projection
- expectedDate IS the first occurrence, not a base date

## Don't do
- Don't add a login or auth system unless explicitly asked
- Don't add a database unless explicitly asked
- Don't change the dark theme unless explicitly asked
- Don't remove localStorage persistence logic
