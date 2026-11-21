# Book-A-Boo

Book-A-Boo is an international literary platform for discovering, reading, writing, and sharing stories.

## Stack

- Next.js 15 and React 19
- TypeScript
- Supabase Auth, PostgreSQL, Row Level Security, and Storage
- Vercel production deployments
- Progressive Web App support

## Main reader and author features

- Public author profiles and private account details
- Story drafts, chapters, publication status, and cover uploads
- Reader library and reading lists
- Author follows, comments, reactions, ratings, and notifications
- Reading progress and estimated reading rhythm
- French, English, Spanish, and Portuguese interface options
- Light/dark themes and color palettes
- Separate editorial and platform-administration areas

## Development

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Database

The Supabase schema and its migration history are maintained under `supabase/migrations`. Before changing production schema, verify that repository migrations and the live project's migration history are synchronized.

## Deployment

The `main` branch is connected to the Book-A-Boo Vercel production project. Changes merged into `main` trigger a production deployment.
