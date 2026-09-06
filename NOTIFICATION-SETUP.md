# Discord + Telegram chapter notifications

This build sends chapter notifications without Workers KV.

## Cloudflare secrets / variables
Add these under Worker `read` -> Settings -> Variables and Secrets:

- `SUPABASE_SERVICE_ROLE_KEY` (Secret)
- `DISCORD_WEBHOOK_URL` (Secret)
- `TELEGRAM_BOT_TOKEN` (Secret)
- `TELEGRAM_CHAT_ID` (Variable or Secret)

Keep existing `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

Never expose `SUPABASE_SERVICE_ROLE_KEY`, Discord webhook, or Telegram bot token in browser/client code.

## Publish behavior
- Publish now: notification is sent immediately after the chapter is created/saved.
- Schedule: no notification is sent at upload time. A Cloudflare Cron Trigger checks every minute and sends after `published_at` is due.
- Draft: no notification.
- Bulk publish: sends for each published chapter.

## Duplicate prevention
Delivery state is stored in the existing Supabase `site_settings` row `chapter_notify_state_v1`, not Workers KV.
The first cron run creates a baseline timestamp so old historical chapters are not backfilled.

## Discord layout
- `@everyone`
- Story title links to the manga detail page
- Chapter line
- "Đọc chap mới tại đây" links to the new chapter
- Large cover image

## Telegram layout
- Story title links to the manga detail page
- Chapter line
- Cover image when available
- Inline "Đọc chap mới tại đây" button

## Cron
`wrangler.jsonc` contains `* * * * *`, so scheduled chapters are checked once per minute.

## Runtime env compatibility fix
This build injects the actual Cloudflare Worker handler `env` into the chapter notifier before Astro handles each request. The notifier also falls back to `process.env` under `nodejs_compat`. This prevents newly-added dashboard Variables/Secrets from being missed by the immediate publish hook.

After changing Variables/Secrets in Cloudflare Dashboard, make sure the change is deployed/activated for the current Worker version.
