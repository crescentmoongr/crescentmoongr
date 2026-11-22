# v13.29 — Hero slide transition fix

- Replace the subtle 38px transition with an explicit horizontal slide and fade animation (680ms) using the Web Animations API.
- Animate outgoing and incoming slides independently; preserve arrows, dots, swipe and autoplay.
- Retain CSS fallback and respect reduced-motion preferences.
- No SQL changes.
