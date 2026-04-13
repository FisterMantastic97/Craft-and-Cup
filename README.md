# Craft & Cup

A personal coffee journal and brew calculator. Log your beans, dial in your brews, and build a flavor library over time.

## Features

- **Bean Journal** — Log beans with AI-powered flavor wheel mapping
- **Brew Calculator** — Ratios, grind guides, and step-by-step timers for 8 brew methods
- **Drink Recipes** — Save your favourite drinks with ingredients and steps
- **Coffee Guide** — Interactive grind, roast, milk, and origins guides
- **FAQ** — Common brewing questions answered in plain language

## Local Development

```bash
npm install
npm run dev
```

## Deploying to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) and import the repo
3. In Vercel project settings → **Environment Variables**, add:
   - Key: `ANTHROPIC_API_KEY`
   - Value: your Anthropic API key (get one at console.anthropic.com)
4. Deploy — the AI flavor wheel will work for anyone who visits the URL

## How the API proxy works

The app calls `/api/analyze` (a Vercel serverless function) instead of the Anthropic API directly. Your API key lives in Vercel's environment variables and is never exposed to the browser.
