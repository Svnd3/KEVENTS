# K EVENTS

A fast, responsive storefront for bespoke digital wedding invitations. The site includes an original catalog of 50 designs, dedicated interactive previews, category filters, pricing in Kenyan shillings, and an enquiry flow.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173/`.

## Checks

```bash
npm run lint
npm run build
```

## Enquiry delivery

The enquiry experience runs in preview mode until a form endpoint is configured. Copy `.env.example` to `.env` and set `VITE_ENQUIRY_ENDPOINT` to a Formspree, Basin, or compatible endpoint before publishing.

## Content

- Invitation names, prices, palettes and categories live in `src/data/designs.js`.
- Catalog artwork lives in `src/components/InvitationArtwork.jsx`.
- Tactile opening interactions live in `src/components/InvitationIntro.jsx`.
- Full invitation stories and the demo RSVP flow live in `src/components/InvitationStory.jsx`.
- Each design has a direct preview route at `#preview/<design-slug>`.
- Photography and font sources are documented in `THIRD_PARTY_NOTICES.md`.

The downloaded Dreams Invite and Digital Yes sites were run locally to study interaction pacing and information architecture. They are excluded from source control and are not part of the application; all shipped components and artwork are original.
