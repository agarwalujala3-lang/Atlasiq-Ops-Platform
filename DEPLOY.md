# AtlasIQ Ops Deployment

## Live URL

Production app URL:

`https://atlasiq-ops-platform.netlify.app/`

## Current Hosting Reference

This is the public URL that should be used in project docs, demos, and sharing links:

- https://atlasiq-ops-platform.netlify.app/

## Recommended Production Notes

The app includes:
- Express server routes
- authenticated API endpoints
- persisted workspace storage

If this public URL is being served through a platform that does not keep the Node backend and persistent storage active, some authenticated or saved-data features may need an additional backend deployment.

## Environment Variables

- `OPENAI_API_KEY`
- `OPENAI_MODEL=gpt-4.1-mini`
- `DB_PATH=./db.json`
- `APP_BASE_URL=https://atlasiq-ops-platform.netlify.app/`

