# Discord + Telegram chapter notifications

This build promotes the three notification credentials from **Cloudflare Build secrets** into encrypted **Worker runtime secrets** during deployment. The values are never committed to GitHub.

## 1) Cloudflare Build variables/secrets
In Worker `read` -> Settings -> Build -> Variables and Secrets, keep these exact names:

- `SUPABASE_SERVICE_ROLE_KEY` — Secret
- `DISCORD_WEBHOOK_URL` — Secret
- `TELEGRAM_BOT_TOKEN` — Secret

`TELEGRAM_CHAT_ID` is non-secret and is declared in `wrangler.jsonc`.

## 2) Change the Deploy command once
In the Worker Git build settings use:

- Build command: `npm run build`
- Deploy command: `npm run deploy`

Do not use `npx wrangler deploy` directly for this build, because the custom deploy script is what uploads the Build secrets as Worker runtime secrets.

## 3) What the deploy script does
`scripts/deploy-with-runtime-secrets.mjs` checks the three Build secrets, writes a temporary local JSON file inside the Cloudflare build container, runs:

`wrangler deploy --secrets-file <temporary file>`

and deletes the temporary file immediately afterward.

The temporary file is gitignored and is not part of the repository.

## 4) Expected notification log
After deployment, a publish test should report:

- `serviceRoleKey: true`
- `discordWebhook: true`
- `telegramBotToken: true`
- `telegramChatId: true`

Then Discord and Telegram are called for real. Scheduled chapters are checked once per minute by the Cron trigger.


## 2026-09-06 deploy fix
Runtime notification values are uploaded with `wrangler deploy --secrets-file` from Cloudflare Build Variables/Secrets. `wrangler.jsonc` intentionally does NOT declare `secrets.required`, because Wrangler validates required secrets before the same deploy can upload them. Keep deploy command as `npm run deploy`. `TELEGRAM_CHAT_ID` is uploaded the same way, so no notification value is committed to GitHub.
