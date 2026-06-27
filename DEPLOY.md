# AtlasIQ Ops Deployment

## Recommended Host

Use Render as a Node web service.

Why:
- this app uses an Express server
- it has authenticated API routes
- it needs persistent storage for `db.json`

## Included Deployment Config

The repository should include a `render.yaml` file with:
- Node runtime
- `npm install` build
- `npm start` launch
- persistent disk mounted at `/var/data`
- `DB_PATH=/var/data/atlasiq-ops-db.json`

## Required Environment Variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional, defaults to `gpt-4.1-mini`)
- `DB_PATH` (already defined in `render.yaml`)

## Important Note

The current app uses a file-backed database.
That means persistent disk storage is required in production.
Without a persistent disk, user accounts and workspaces can be lost on restart or redeploy.

## Best Next Upgrade

Replace file-backed persistence with a managed database such as Postgres for stronger production reliability.

