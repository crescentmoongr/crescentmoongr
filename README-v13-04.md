# Crescent Reader v13.04 — Comment likes

1. Run `supabase-v13-04-comment-likes.sql` in Supabase SQL Editor first.
2. Update four source files plus SQL: `src/pages/manga/[slug].astro`, `src/lib/supabase.ts`, `src/pages/api/comments/like.ts`, `src/styles/global.css`.
3. Signed-in users can like/unlike comments. Guests can see counts and will be redirected to login.
4. Applies to main comments and replies; keeps the v13.03 reply icon.
5. Build and live deployment not tested.
