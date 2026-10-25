# Hungry Haddock preview deployment

Vercel project: `epos` in `d7yabs-projects`.

Pushes to `feature/hungry-haddock` create a Preview deployment through the
existing GitHub integration. Preview access uses the project's existing
Vercel Authentication protection.

## Branch environment

The following variables are configured for the Preview environment and scoped
to `feature/hungry-haddock`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (compatibility alias)

These settings use the Hungry Haddock Supabase project. The service-role key
is optional with the owner-approved public-key database permissions.

Keep actual values in Vercel environment settings and the ignored `.env.local`.
New environment values take effect on the next deployment.

## Build verification

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit --incremental false
pnpm build
```

See `supabase/HUNGRY_HADDOCK_SETUP.md` for database setup and the menu imports.
