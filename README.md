# Voyagr — AI Travel Planner

A modern, AI-powered travel planning app built with React, TypeScript, Redux Toolkit, and TanStack Router.

## Tech Stack

- **Frontend** — React 19 + TypeScript + Vite
- **State** — Redux Toolkit (auth slice) + TanStack Query
- **Routing** — TanStack Router (file-based)
- **Styling** — Tailwind CSS v4 + custom ocean palette
- **AI** — Google Gemini API (itinerary generation)
- **Images** — Unsplash API (place photos)
- **Deploy** — Vercel (serverless API routes included)

---

## Quick Start

### 1. Clone & install

```bash
npm install
```

### 2. Get your API keys

| Service | Where to get it | Free tier |
|---------|----------------|-----------|
| **Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | ✅ Yes |
| **Unsplash** | [unsplash.com/developers](https://unsplash.com/developers) | ✅ 50 req/hr |

### 3. Create `.env` file

```bash
cp .env.example .env
```

Then fill in your keys:

```env
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_key_here
```

### 4. Run

```bash
npm run dev
```

App runs at `http://localhost:5173`

---

## Deploying to Vercel

1. Push to GitHub
2. Import repo at [vercel.com/new](https://vercel.com/new)
3. Add environment variables in Vercel dashboard:
   - `VITE_GEMINI_API_KEY`
   - `VITE_UNSPLASH_ACCESS_KEY`
4. Deploy — the `/api` serverless functions are auto-detected

> The API keys are used **server-side only** in `/api/generate-itinerary.js` and `/api/place-image.js` — they're never exposed to the browser.

---

## Project Structure

```
src/
├── store/
│   ├── index.ts          # Redux store
│   ├── authSlice.ts      # Auth state (login/signup/logout/rehydrate)
│   └── hooks.ts          # Typed useAppDispatch / useAppSelector
├── lib/
│   ├── auth.tsx          # useAuth() hook (wraps Redux slice)
│   ├── ai-planner.ts     # Gemini itinerary generator
│   ├── place-image.ts    # Unsplash image fetcher
│   └── trip-data.ts      # Trip types & localStorage persistence
├── components/voyage/
│   ├── Landing.tsx       # Home page
│   ├── Dashboard.tsx     # Trip workspace
│   ├── AuthModal.tsx     # Login / Sign up modal
│   └── ManualPlanModal.tsx
├── routes/
│   ├── __root.tsx        # Root layout
│   ├── index.tsx         # Landing route (/)
│   └── app.tsx           # Dashboard route (/app)
api/
├── generate-itinerary.js # Vercel serverless → Gemini
└── place-image.js        # Vercel serverless → Unsplash
```

---

## Auth Flow (Redux)

Auth state lives in `src/store/authSlice.ts`:

```
App loads → rehydrateAuth() checks localStorage
         → if found: status = "authenticated"
         → if not:   status = "unauthenticated"

Login/Signup → loginThunk / signupThunk
             → saves user to localStorage
             → status = "authenticated"

Logout → clears localStorage
       → status = "unauthenticated"
```

Users and passwords are stored in `localStorage` (demo/prototype mode). For production, replace the thunks with real API calls.

---

## Environment Variables Reference

| Variable | Used in | Purpose |
|----------|---------|---------|
| `VITE_GEMINI_API_KEY` | `api/generate-itinerary.js` | Gemini AI itinerary generation |
| `VITE_UNSPLASH_ACCESS_KEY` | `api/place-image.js` | Unsplash place photos |

