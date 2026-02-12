# LLL Mini App (bootstrap)

This repo is initialized from the Lucky10 infrastructure pattern:

- Next.js App Router
- Telegram Mini App initData verification (`@tma.js/init-data-node`)
- Cookie session via `iron-session`
- Postgres via Prisma (DB can be Supabase Postgres)

## Setup

1. Copy env:

```bash
cp .env.example .env
```

2. Install deps:

```bash
npm i
```

3. Run migrations (after setting `DATABASE_URL`):

```bash
npm run prisma:migrate
```

4. Start dev:

```bash
npm run dev
```

## Implemented

- `POST /api/auth` – validates Telegram initData, upserts user, sets session cookie
- `GET /api/auth` – returns current session/profile
