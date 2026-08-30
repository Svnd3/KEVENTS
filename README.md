# Tell & Wed

A fast, responsive storefront for bespoke digital wedding invitations. The site includes a catalog of 70 designs, dedicated interactive previews, category filters, tiered one-time pricing in Kenyan shillings, a device-persistent saved-design shortlist, and an enquiry flow.

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
npm run check:webgency
```

To refresh the eight locally mirrored Webgency templates and their shared assets from their source pages, run:

```bash
npm run sync:webgency
```

The imported designs have been editorially adapted for Tell & Wed: the phone-frame catalog artwork is replaced with portrait photography, visible copy is in English, each design has its own palette and display typeface, and original template audio is disabled in favour of the project soundtracks. Internet-sourced photography is downloaded locally, so previews do not depend on third-party image hosts at runtime.

Direct preview routes for the imported designs are:

- `/#preview/the-sacred-garden`
- `/#preview/blossom-oud`
- `/#preview/dolce-vita`
- `/#preview/vibrant-vows`
- `/#preview/destination-love`
- `/#preview/eternal-romance`
- `/#preview/royal-gold`
- `/#preview/minimalist`

The latest background-film invitations are available at:

- `/#preview/crimson-orbit`
- `/#preview/heartburst-after-dark`
- `/#preview/electric-vow`
- `/#preview/blush-forecast`

After running `npm run sync:webgency`, you can inspect its generated recovery copy independently by serving the repository root and opening `/webgencyinvitations.com/`:

```bash
python3 -m http.server 4190 --bind 127.0.0.1
```

## Enquiry delivery

The enquiry experience runs in preview mode until a form endpoint is configured. Copy `.env.example` to `.env` and set `VITE_ENQUIRY_ENDPOINT` to a Formspree, Basin, or compatible endpoint before publishing.

The scroll-film invitations and imported Webgency templates have guest RSVP forms. Set `VITE_RSVP_ENDPOINT` to a compatible endpoint to receive those replies. Imported templates never send RSVP details to their original form service and clearly run in demo mode when this endpoint is omitted.

Every design submits the same compact `kevents-rsvp-v1` payload. `name` and `attendance` (`attending` or `declined`) are always required. Attendees also provide `partySize`; `requirements` combines guest names, children’s ages, dietary needs, and accessibility needs in one optional answer, while `song` is optional. Declining guests can leave an optional `message`. The payload also includes `template`, `templateId`, and `eventType` where available.

## Accounts, reports, currency and legal setup

The current sign-up, sign-in and account experience is a browser-only prototype. It stores a salted PBKDF2 password verifier and profile data on the current device, but it is not production authentication. Replace `src/account/authClient.js` with a server-side identity provider before accepting real customer accounts or sensitive information.

Reports are delivered as JSON when `VITE_REPORT_ENDPOINT` is configured. Without it, the report dialog clearly creates an unsent demo receipt. Set `VITE_CONTACT_EMAIL` to the public support/legal inbox used by the Terms, Privacy Notice and Cookie Policy.

Country detection uses browser time zone and language without requesting precise location. Visitors can override the detected country; its currency is then selected automatically. Foreign-currency values are indicative conversions from KES, and the rates in `src/utils/currency.js` should be refreshed regularly. Promotional “Was” amounts are explicit `compareAtPrice` values in `src/data/designs.js`; verify that each is a genuine prior price before publishing.

The included legal documents are a practical Kenya-oriented draft, not a substitute for advice from a qualified lawyer. Confirm the legal business identity, contact details, refund practice, payment flow and data processors before launch.

## Content

- Invitation names, exact prices, pricing tiers, palettes and categories live in `src/data/designs.js`.
- Catalog artwork lives in `src/components/InvitationArtwork.jsx`.
- Every design uses the shared lace-and-wax envelope opener in `src/components/SponsaliaEnvelopeIntro.jsx`.
- Full invitation stories and the demo RSVP flow live in `src/components/InvitationStory.jsx`.
- The scroll-film stories live in `src/components/CinematicWeddingStory.jsx` and `src/components/ScrollWeddingStory.jsx`, with editable copy and venue details in their matching files under `src/data`.
- Each design has a direct preview route at `#preview/<design-slug>`.
- The eight Webgency designs use locally mirrored documents in an isolated preview sandbox; their files live in `public/templates/webgency` and their catalog covers in `public/images/webgency`.
- Photography and font sources are documented in `THIRD_PARTY_NOTICES.md`.

The downloaded Dreams Invite, Digital Yes, and Sponsalia sites were run locally to study interaction pacing and information architecture. These reference captures are excluded from source control; the one licensed envelope poster used by the app is bundled in `public/media`. The Webgency pages remain the explicit imported template set, with source metadata retained in `public/templates/webgency/templates.json`.
