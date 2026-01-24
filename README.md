# Jobber Lambda App UI

A Yew/Rust WebAssembly frontend for Jobber OAuth integration. This UI can be used for multiple Jobber apps by configuring environment variables.

## Prerequisites

- Rust toolchain
- [Trunk](https://trunkrs.dev/) for building/serving

## Environment Variables

Set these environment variables before building:

| Variable | Description |
|----------|-------------|
| `JOBBER_OAUTH_HANDLER_FUNCTION_URL` | Lambda URL for OAuth handler |
| `JOBBER_APP_FUNCTION_URL` | Lambda URL for the app's backend |
| `JOBBER_APP_CLIENT_ID` | Jobber OAuth client ID |
| `JOBBER_APP_REDIRECT_URI` | OAuth redirect URI |
| `JOBBER_APP_NAME` | App name for OAuth handler |

## Development

```bash
# Set environment variables (or source from .env file)
export JOBBER_OAUTH_HANDLER_FUNCTION_URL=https://...
export JOBBER_APP_FUNCTION_URL=http://localhost:8080
export JOBBER_APP_CLIENT_ID=your-client-id
export JOBBER_APP_REDIRECT_URI=https://your-app.example.com
export JOBBER_APP_NAME=your-app-name

# Serve locally
trunk serve
```

## Deployment

1. Source the environment variables for the target app:

   ```bash
   source .env
   ```

2. Build for release:

   ```bash
   trunk build --release
   ```

3. Deploy the `dist/` directory to S3:

   ```bash
   aws s3 sync dist/ s3://your-app-bucket/
   ```

## React/Tailwind prototype

- Location: [web](web) (keeps the Rust/Yew code intact while you try React)
- Config: copy [web/public/config.example.json](web/public/config.example.json) to [web/public/config.json](web/public/config.json) and fill in your Lambda URLs and OAuth details
- Run locally:

   ```bash
   npm install
   npm run dev
   ```

- Build/preview:

   ```bash
   npm run build
   npm run preview
   ```
