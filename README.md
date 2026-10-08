# GoFérias

GoFérias is a React and Vite vacation-rental marketplace and owner dashboard. Supabase provides authentication and data; Vercel hosts the frontend and serverless API functions.

## Requirements

- Node.js 20 or newer with Corepack
- A Supabase project
- A Gemini API key for the pricing assistant

## Local development

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env` and provide the Supabase URL/key and `GEMINI_API_KEY`.
3. Run `pnpm dev` and open the URL printed by Vite.

The Vite development server serves `POST /api/chat` and `POST /api/pricing-suggestion`. The Gemini key is read server-side and must not use a `VITE_` prefix. The Marketplace map uses OpenStreetMap tiles and displays markers for properties with latitude and longitude.

## Validation and deployment

- `pnpm typecheck` checks the frontend, API functions, and Vite configuration.
- `pnpm build` builds the static frontend into `dist`.
- Deploy the repository to Vercel. `vercel.json` configures the Vite build; files in `api/` are deployed as serverless functions.
- Set `GEMINI_API_KEY` and the Supabase URL/anon key as Vercel environment variables.
- Apply the SQL migrations in `supabase/migrations/` to prepare the database schema, image storage, reservations, and competitor search.
