# Hungry Haddock deployment

Vercel project: `hungry-haddock` in `d7yabs-projects`.

Production URL: https://hungry-haddock.vercel.app

The project uses the same `D7YAB/EPOS` repository, with
`feature/hungry-haddock` configured as its Production branch. Pushes to this
branch create Production deployments for Hungry Haddock. Other branches create
Preview deployments. The original `epos` project continues to use `main` for
Production.

Vercel Authentication remains configured using the project's default protection.

## Environment

The following variables are configured for Production, Preview and Development
in the `hungry-haddock` project:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

These settings use the Hungry Haddock Supabase project. The service-role key
is optional with the owner-approved public-key database permissions.

Keep actual values in Vercel environment settings and the ignored `.env.local`.
New environment values take effect on the next deployment. Postcode lookup
requires a separate `IDEAL_POSTCODES_API_KEY` in this project's settings.

The original `epos` project also retains the existing branch-specific Preview
configuration for `feature/hungry-haddock`.

## Build verification

```sh
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit --incremental false
pnpm build
```

See `supabase/HUNGRY_HADDOCK_SETUP.md` for database setup and the menu imports.
