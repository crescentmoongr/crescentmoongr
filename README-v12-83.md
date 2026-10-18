v12.83 — Account favorites

Adds a compact favorites section below achievements in /account, using the same small cover card layout as bookmarks, sorted newest first with Show more after 12.

Run supabase-v12-83-account-favorites.sql in Supabase SQL Editor before deploying. The SQL looks for an existing favorites table under common names; if the current toggle_series_favorite function uses another table or schema, adjust it before deployment. Existing favorite records are not modified.
