# Jobber Lambda App UI

A React/TypeScript frontend for Jobber OAuth integration. This UI can be used for multiple Jobber apps by configuring a runtime config file.

## Prerequisites

- Node.js >= 18

## Configuration

Copy the example config and fill in your values:

```bash
cp public/config.example.json public/config.json
```

Edit `public/config.json`:

| Field | Description |
|-------|-------------|
| `JOBBER_OAUTH_HANDLER_FUNCTION_URL` | Lambda URL for OAuth handler |
| `JOBBER_APP_FUNCTION_URL` | Lambda URL for the app backend |
| `JOBBER_APP_CLIENT_ID` | Jobber OAuth client ID |
| `JOBBER_APP_REDIRECT_URI` | OAuth redirect URI |
| `JOBBER_APP_NAME` | App name for OAuth handler |
| `JOBBER_APP_TITLE` | Browser tab title (optional) |

## Development

```bash
npm install
npm run dev
```

## Deployment

1. Build for production:

   ```bash
   npm run build
   ```

2. Deploy the `dist/` directory to your web server or S3:

   ```bash
   aws s3 sync dist/ s3://your-app-bucket/
   ```

3. Ensure `config.json` is present at the root of your deployed site.
