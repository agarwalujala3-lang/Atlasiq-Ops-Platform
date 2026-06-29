# AtlasIQ Ops Deployment

## Live URL

Production app URL:

`https://atlasiq-ops-platform.onrender.com`

## Public Access Model

This is the single public URL that should be used in project docs, demos, and sharing links:

- https://atlasiq-ops-platform.onrender.com/

The frontend and backend are served through the same Render deployment so users only interact with one public domain.

## Environment Variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4.1-mini`
- `DB_PATH=/var/data/atlasiq-ops-db.json`
- `APP_BASE_URL=https://atlasiq-ops-platform.onrender.com/`
