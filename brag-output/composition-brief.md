# Hyperframes Composition Brief: EcoDash

## Objective
Create a short launch-style brag video for EcoDash.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: landscape — 1920x1080
- Duration: 21.5 seconds

## Source Material
- Project root: `EcoDash/` (Expo mobile app in `frontend/`)
- Primary files read: `frontend/app/(auth)/welcome.tsx`, `frontend/app/(tabs)/{index,create-offer,requests,rewards}.tsx`, `frontend/app/(collector-tabs)/scan.tsx`, `frontend/app/(vendor-tabs)/index.tsx`, `frontend/constants/{config,theme}.ts`, `frontend/app.json`
- Files deliberately not read: `.env*`, credentials, `services/firebase.ts`, `lib/api.ts` (hosts and keys)
- Product name: EcoDash
- Tagline: "Turn Waste into Worth"
- Key UI to recreate: the welcome screen (gradient, logo in rings, divider tagline), *Create Waste Offer*, *Scan User QR Code*, *Vendor Dashboard*
- Copy that must appear verbatim: "WELCOME TO", "EcoDash", "Turn Waste into Worth", "Create Waste Offer", "Create Offer", "Scan User QR Code", "Verify User", "Points to Award:", "Cash to Award:", "Vendor Dashboard", "Today Weight", "Today Purchases", "Total Spent"

## Creative Direction
- Tone preset: default. Direction: bright, confident, community-proud launch spot.
- Angle, hook and outro: see `brag-plan.md`.
- Avoid: generic SaaS language, abstract filler, redesigning the app's look.

## Visual Identity
- Gradient #2DD36F → #1FAF5B → #16874A; hook background #0B3D22; app surfaces #FFFFFF / #F5F6FA / #E8F5E9
- Accent #2ECC71; deep green #16874A; text #11181C
- Fonts: system UI stack (as the app uses the platform default)

## Storyboard
1. Hook — 2.65s — "Your waste / has a price."
2. Reveal — 3.69s — welcome screen, wordmark beat-locked to 3.70
3. You list it — 4.20s — Create Waste Offer flow
4. A collector picks it up — 4.22s — QR scan → verify → points count-up
5. A vendor buys it — 3.15s — three stat cards on the beat grid
6. Outro — 3.59s — role chain, wordmark, logo, tagline

## Audio
- Music: `assets/music/happy-beats-business-moves-vol-9-by-ende-dot-app.mp3`, volume 0.5, fade-in 0.3s, fade-out 1.5s
- Cue source: bundled preset `music-cues/…vol-9…json`. Beat-locked: 1.07, 3.70, 6.34, 10.54, 17.91, 18.96. Beat-grid: 15.28 / 15.81 / 16.34.
- Audio-reactive: none (intentional restraint)
- SFX (Kenney CC0, low/medium HF risk): soft impacts on the hook and outro, bells on the two brand moments, click_003 on taps, keypresses on typing, bong on the toast and verify, card-slide on the vendor cards.
