import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import {
  editorialPhotos,
  photosForTemplate,
  templateCustomizations,
} from './webgency-customizations.mjs'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const templateRoot = path.join(projectRoot, 'public', 'templates', 'webgency')
const assetRoot = path.join(templateRoot, 'assets')
const editorialRoot = path.join(templateRoot, 'editorial')
const coverRoot = path.join(projectRoot, 'public', 'images', 'webgency')
const recoveredRoot = path.join(projectRoot, 'webgencyinvitations.com')
const reuseAssets = process.argv.includes('--reuse-assets')
const refreshGenerated = process.argv.includes('--refresh-generated')
const execFileAsync = promisify(execFile)

const templates = [
  {
    slug: 'sacred-garden',
    name: 'The Sacred Garden',
    source: 'https://webgencyinvitations.com/thesacredgarden',
    cover: 'https://optim.tildacdn.net/tild6639-3932-4435-b233-303638356134/-/cover/720x800/center/center/-/format/webp/Group_78.png.webp',
  },
  {
    slug: 'blossom-oud',
    name: 'Blossom & Oud',
    source: 'https://webgencyinvitations.com/blossomoud',
    cover: 'https://optim.tildacdn.net/tild3532-6466-4635-b263-303962613166/-/cover/720x800/center/center/-/format/webp/Group_76.png.webp',
  },
  {
    slug: 'dolce-vita',
    name: 'Dolce Vita',
    source: 'https://webgencyinvitations.com/dolcevita',
    cover: 'https://optim.tildacdn.net/tild3865-3139-4436-b432-643635633639/-/cover/720x800/center/center/-/format/webp/Group_71.png.webp',
  },
  {
    slug: 'vibrant-vows',
    name: 'Vibrant Vows',
    source: 'https://webgency.tilda.ws/template5',
    cover: 'https://optim.tildacdn.net/tild6263-3831-4264-a530-653733313435/-/cover/720x800/center/center/-/format/webp/Group_64.png.webp',
  },
  {
    slug: 'destination-love',
    name: 'Destination Love',
    source: 'https://webgencyinvitations.com/destinationlove',
    cover: 'https://optim.tildacdn.net/tild6439-3930-4636-b838-306133363963/-/cover/720x800/center/center/-/format/webp/Group_52.jpg.webp',
  },
  {
    slug: 'eternal-romance',
    name: 'Eternal Romance',
    source: 'https://webgency.tilda.ws/jathuandthanu',
    cover: 'https://optim.tildacdn.net/tild3138-3033-4363-b436-356330313866/-/cover/720x800/center/center/-/format/webp/Group_59.png.webp',
  },
  {
    slug: 'royal-gold',
    name: 'Royal Gold',
    source: 'https://template2.tilda.ws',
    cover: 'https://optim.tildacdn.net/tild3430-3930-4433-a330-333733356336/-/cover/720x800/center/center/-/format/webp/Group_48_3.jpg.webp',
  },
  {
    slug: 'minimalist',
    name: 'Minimalist',
    source: 'https://template3.tilda.ws',
    cover: 'https://optim.tildacdn.net/tild3066-6539-4564-a663-333939656264/-/cover/720x800/center/center/-/format/webp/Group_49_4.jpg.webp',
  },
]

const nativeIntroSelectors = new Map([
  ['sacred-garden', ['#weiOverlay', '#weiVideoWrap']],
  ['blossom-oud', ['#rec2443433693']],
  ['dolce-vita', ['#rec2442650973']],
  ['vibrant-vows', ['#rec2052880283']],
  ['destination-love', ['#popup-overlay']],
  ['eternal-romance', ['#popup-overlay']],
  ['royal-gold', ['#preloader', '#curtain-overlay']],
  ['minimalist', ['#rec2072082223']],
])

const removableNativeIntroRecords = new Map([
  ['sacred-garden', ['2487446003']],
  ['blossom-oud', ['2443433693', '2443433703']],
  ['dolce-vita', ['2442650973', '2442650983']],
  ['vibrant-vows', ['2052880283', '2052873013']],
  ['destination-love', ['2132511073']],
  ['eternal-romance', ['1875002831']],
  ['royal-gold', ['2225137013']],
  ['minimalist', ['2072082223', '2072083833']],
])

const catalog = {
  slug: 'catalog',
  name: 'Webgency Invitations',
  source: 'https://webgencyinvitations.com/',
}

const assetHosts = new Set([
  'dl.dropboxusercontent.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'neo.tildacdn.com',
  'optim.tildacdn.net',
  'pub-4dc8201144ca418fb604349c73e8c724.r2.dev',
  'res.cloudinary.com',
  'static.tildacdn.com',
  'static.tildacdn.net',
  'thb.tildacdn.net',
])

const contentTypeExtensions = new Map([
  ['audio/mpeg', '.mp3'],
  ['font/ttf', '.ttf'],
  ['font/woff', '.woff'],
  ['font/woff2', '.woff2'],
  ['image/avif', '.avif'],
  ['image/gif', '.gif'],
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/svg+xml', '.svg'],
  ['image/webp', '.webp'],
  ['text/css', '.css'],
  ['text/javascript', '.js'],
  ['video/mp4', '.mp4'],
  ['video/quicktime', '.mov'],
  ['video/webm', '.webm'],
])

const pages = new Map()
const assets = new Map()
const assetsByName = new Map()
const existingAssets = new Map()
const failedAssets = []
const embeddedFonts = new Map()

function decodeEntities(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&#38;', '&')
    .replaceAll('&#x26;', '&')
}

function normalizeUrl(value) {
  try {
    const url = new URL(decodeEntities(value.trim()))
    url.hash = ''
    return url.href
  } catch {
    return null
  }
}

function isAssetUrl(value) {
  try {
    const url = new URL(value)
    return assetHosts.has(url.hostname) && (url.pathname !== '/' || Boolean(url.search))
  } catch {
    return false
  }
}

function extractAbsoluteUrls(text) {
  const found = new Map()
  const quoted = /(["'])(https?:\/\/[^"'<>]+)\1/g
  const unquotedCss = /url\(\s*(https?:\/\/[^)\s]+)\s*\)/g
  let match

  while ((match = quoted.exec(text))) {
    const normalized = normalizeUrl(match[2])
    if (normalized && isAssetUrl(normalized)) found.set(match[2], normalized)
  }

  while ((match = unquotedCss.exec(text))) {
    const normalized = normalizeUrl(match[1])
    if (normalized && isAssetUrl(normalized)) found.set(match[1], normalized)
  }

  return found
}

function extractCssUrls(text, source) {
  const found = new Map()
  const pattern = /url\(\s*(["']?)([^"')]+)\1\s*\)/g
  let match

  while ((match = pattern.exec(text))) {
    const raw = decodeEntities(match[2].trim())
    if (!raw || raw.startsWith('data:') || raw.startsWith('#')) continue
    try {
      const resolved = new URL(raw, source).href
      if (isAssetUrl(resolved)) found.set(match[2], resolved)
    } catch {
      // Ignore malformed third-party CSS references.
    }
  }

  return found
}

function absolutizeRootReferences(html, source) {
  const origin = new URL(source).origin
  return html
    .replace(
      /(\b(?:href|src|action|poster|data-original)\s*=\s*["'])\/(?!\/)/gi,
      `$1${origin}/`,
    )
    .replace(/(url\(\s*["'])\/(?!\/)/gi, `$1${origin}/`)
}

function preparePageHtml(html, source) {
  return absolutizeRootReferences(html, source)
    .replace(
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@400&display=swap',
      'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400&display=swap',
    )
    .replace(/<link\b(?=[^>]*\brel=["'](?:dns-prefetch|preconnect)["'])[^>]*>\s*/gi, '')
    .replace(/<base\b[^>]*>\s*/gi, '')
    // The source serves JavaScript under this CSS URL, so browsers cannot use it.
    .replace(/<link\b(?=[^>]*\bhref=["']https:\/\/webgencyinvitations\.com\/custom\.css[^"']*["'])[^>]*>\s*/gi, '')
    .replace(/\sdata-field-receivers-value=(["'])[^"']*\1/gi, ' data-field-receivers-value=""')
    // Sandboxed previews have an opaque origin, so Tilda's visit animation cannot use storage.
    .replace(/typeof\(sessionStorage\)!=['"]undefined['"]&&sessionStorage\.getItem\(['"]visited['"]\)!==['"]y['"]&&/g, '')
    .replace(/sessionStorage\.setItem\(["']visited["'],["']y["']\);?/g, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => (
      /tilda-stat-1\.0|stat\.tildaapi\./i.test(script) ? '' : script
    ))
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function isOriginalAudioUrl(value) {
  try {
    return /\.(?:mp3|m4a|aac|ogg)(?:$|[?#])/i.test(new URL(value).pathname)
  } catch {
    return false
  }
}

function replaceCaseInsensitive(text, search, replacement) {
  return text.replace(new RegExp(escapeRegExp(search), 'gi'), replacement)
}

function replacePhotoElement(html, assetFragment, filename) {
  const elementPattern = new RegExp(`<[^>]*${escapeRegExp(assetFragment)}[^>]*>`, 'gi')
  const localPhoto = `../editorial/${filename}`
  return html.replace(elementPattern, (element) => (
    element.replace(/\.\.\/assets\/[a-zA-Z0-9._-]+/g, localPhoto)
  ))
}

function customizePageHtml(page, sourceHtml) {
  const customization = templateCustomizations[page.slug]
  if (!customization) return sourceHtml

  let html = sourceHtml
    .replace(/<html\b[^>]*>/i, '<html lang="en">')
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${customization.title}</title>`)

  for (const [source, replacement] of customization.copy) {
    html = html.replaceAll(source, replacement)
  }
  for (const [source, replacement] of customization.colors) {
    html = replaceCaseInsensitive(html, source, replacement)
  }

  const photos = new Map(photosForTemplate(page.slug).map((photo) => [photo.role, photo]))
  for (const [assetFragment, role] of customization.photoTargets) {
    const photo = photos.get(role)
    if (photo) html = replacePhotoElement(html, assetFragment, photo.filename)
  }

  return html
}

function customizationMarkup(page) {
  const customization = templateCustomizations[page.slug]
  if (!customization) return ''

  const photos = photosForTemplate(page.slug)
  const hero = photos.find((photo) => photo.role === 'hero')
  const inter = embeddedFonts.get('Inter')
  const display = embeddedFonts.get(customization.displayFont)
  const accent = customization.colors[0]?.[1] || '#665a50'
  const data = JSON.stringify({
    slug: page.slug,
    venue: customization.venue,
    directionsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(customization.venue)}`,
    hiddenVideoRecord: customization.heroRecord || null,
    photos: photos.map(({ filename, alt }) => ({ filename, alt })),
  }).replaceAll('<', '\\u003c')

  const heroOverlay = page.slug === 'sacred-garden'
    ? 'linear-gradient(180deg,rgba(245,241,231,.58),rgba(245,241,231,.42))'
    : 'linear-gradient(180deg,rgba(22,16,19,.12),rgba(22,16,19,.42))'
  const heroRecordCss = customization.heroRecord && hero
    ? `#rec${customization.heroRecord} .t396__carrier{background-image:${heroOverlay},url("../editorial/${hero.filename}")!important;background-position:center!important;background-size:cover!important}#rec${customization.heroRecord} video,#rec${customization.heroRecord} canvas{opacity:0!important;pointer-events:none!important}#rec${customization.heroRecord} img[src*="Gemini"],#rec${customization.heroRecord} img[data-original*="Gemini"]{opacity:0!important}`
    : ''
  const openerSelectors = nativeIntroSelectors.get(page.slug) || []
  const openerCss = openerSelectors.length
    ? `${openerSelectors.join(',')}{display:none!important}${page.slug === 'royal-gold' ? 'body.loading{overflow:auto!important}' : ''}`
    : ''
  const introBypassCss = page.slug === 'sacred-garden'
    ? '#rec2487446043 .js-delay-anim{opacity:1!important;transform:none!important}'
    : ''

  return `<script id="kevents-customization-data">window.__KEVENTS_TEMPLATE=${data};</script>
<style id="kevents-customization-style">
  @font-face{font-family:'K Events Sans';src:url(data:font/woff2;base64,${inter}) format('woff2');font-style:normal;font-weight:100 900;font-display:swap}
  @font-face{font-family:'K Events Display';src:url(data:font/woff2;base64,${display}) format('woff2');font-style:normal;font-weight:300 700;font-display:swap}
  :root{--kevents-accent:${accent};--kevents-display:'K Events Display',Georgia,serif;--kevents-sans:'K Events Sans',Arial,sans-serif}
  .kevents-display{font-family:var(--kevents-display)!important;font-kerning:normal!important;letter-spacing:-.018em}
  input,select,textarea,.t-submit,button{font-family:var(--kevents-sans)!important}
  img[src*="../editorial/"],img[data-original*="../editorial/"]{object-fit:cover}
${heroRecordCss ? `  ${heroRecordCss}\n` : ''}${openerCss ? `  ${openerCss}\n` : ''}${introBypassCss ? `  ${introBypassCss}\n` : ''}</style>`
}

const localRuntime = `<meta name="referrer" content="no-referrer">
<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: blob:; base-uri 'self'; connect-src 'none'; font-src data:; form-action 'none'; frame-src https://www.google.com; img-src 'self' data: blob:; media-src 'self' data: blob:; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'">
<style id="kevents-local-style">
  .kevents-local-notice{position:fixed;right:16px;bottom:16px;z-index:2147483647;max-width:min(360px,calc(100vw - 32px));padding:13px 16px;border-radius:10px;background:#171714;color:#fff;font:600 14px/1.4 Arial,sans-serif;box-shadow:0 10px 35px #0004}
  .kevents-local-notice[data-error="true"]{background:#8a2525}
  #audio-control,#weiAudioBtn{display:none!important}
  .kevents-venue-card{box-sizing:border-box;display:flex;width:100%;height:100%;min-height:220px;align-items:center;justify-content:center;padding:28px;border:1px solid color-mix(in srgb,var(--kevents-accent,#665a50) 34%,transparent);border-radius:18px;background:linear-gradient(145deg,#fff9,#fff4),radial-gradient(circle at 78% 14%,color-mix(in srgb,var(--kevents-accent,#665a50) 22%,transparent),transparent 42%),#f4f0e9;color:#272522;text-align:center;font-family:var(--kevents-sans,Arial,sans-serif)}
  .kevents-venue-card__eyebrow{margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--kevents-accent,#665a50)}
  .kevents-venue-card__title{margin:0 0 18px;font:500 clamp(25px,5vw,42px)/1.05 var(--kevents-display,Georgia,serif)}
  .kevents-venue-card__link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:0 18px;border:1px solid currentColor;border-radius:999px;color:inherit;text-decoration:none;font-size:13px;font-weight:700}
  .kevents-traveling-rose{position:fixed;left:clamp(12px,4vw,36px);bottom:clamp(14px,5vh,46px);z-index:40;width:clamp(44px,7vw,70px);pointer-events:none;opacity:.38;transform:rotate(-12deg);filter:drop-shadow(0 5px 9px #2a14162b)}
  .kevents-traveling-rose img{display:block;width:100%;height:auto}
  .kevents-rsvp-host,.kevents-rsvp-host>.tn-atom{height:auto!important;min-height:0!important}
  .kevents-rsvp-shell{max-height:min(88vh,860px);overflow-y:auto;overscroll-behavior:contain;scrollbar-gutter:stable}
  form.kevents-rsvp{--kevents-rsvp-ink:color-mix(in srgb,var(--kevents-accent,#665a50) 30%,#171714);box-sizing:border-box;width:100%;max-width:560px;margin-inline:auto;color:var(--kevents-rsvp-ink);font:400 15px/1.45 var(--kevents-sans,Arial,sans-serif);text-align:left}
  form.kevents-rsvp *,form.kevents-rsvp *::before,form.kevents-rsvp *::after{box-sizing:border-box}
  .kevents-rsvp__intro{margin:0 0 20px;color:color-mix(in srgb,var(--kevents-rsvp-ink) 68%,transparent);font-size:13px;text-align:center}
  .kevents-rsvp__fields{display:grid;gap:18px}
  .kevents-rsvp__field,.kevents-rsvp__attendance{min-width:0;margin:0;padding:0;border:0}
  .kevents-rsvp__label,.kevents-rsvp__legend{display:block;margin:0 0 8px;padding:0;color:inherit;font:600 15px/1.3 var(--kevents-sans,Arial,sans-serif)}
  .kevents-rsvp__required{margin-left:5px;color:color-mix(in srgb,var(--kevents-accent,#665a50) 82%,#8a2525);font-size:11px;font-weight:700;letter-spacing:.055em;text-transform:uppercase}
  .kevents-rsvp__hint{display:block;margin:7px 0 0;color:color-mix(in srgb,var(--kevents-rsvp-ink) 62%,transparent);font-size:12px;line-height:1.45}
  form.kevents-rsvp .kevents-rsvp__control{display:block;width:100%!important;min-height:48px!important;margin:0!important;padding:11px 13px!important;border:1px solid color-mix(in srgb,var(--kevents-accent,#665a50) 30%,#b9b4ae)!important;border-radius:10px!important;outline:0;background:color-mix(in srgb,#fff 88%,var(--kevents-accent,#665a50))!important;box-shadow:0 1px 0 #fff8 inset;color:#171714!important;font:400 16px/1.4 var(--kevents-sans,Arial,sans-serif)!important;transition:border-color .18s ease,box-shadow .18s ease,background-color .18s ease}
  form.kevents-rsvp textarea.kevents-rsvp__control{min-height:88px!important;resize:vertical}
  form.kevents-rsvp .kevents-rsvp__control:focus{border-color:var(--kevents-accent,#665a50)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--kevents-accent,#665a50) 18%,transparent)!important;background:#fff!important}
  form.kevents-rsvp .kevents-rsvp__control[aria-invalid="true"]{border-color:#a43131!important;box-shadow:0 0 0 3px #a4313118!important}
  .kevents-rsvp__choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}
  .kevents-rsvp__choice{display:flex;min-height:48px;align-items:center;gap:10px;padding:10px 12px;border:1px solid color-mix(in srgb,var(--kevents-accent,#665a50) 25%,#c6c1bb);border-radius:10px;background:color-mix(in srgb,#fff 82%,var(--kevents-accent,#665a50));cursor:pointer;transition:border-color .18s ease,background-color .18s ease,transform .18s ease}
  .kevents-rsvp__choice:hover{border-color:var(--kevents-accent,#665a50);background:color-mix(in srgb,#fff 72%,var(--kevents-accent,#665a50))}
  .kevents-rsvp__choice:has(input:checked){border-color:var(--kevents-accent,#665a50);background:color-mix(in srgb,#fff 67%,var(--kevents-accent,#665a50));box-shadow:0 0 0 1px var(--kevents-accent,#665a50) inset}
  .kevents-rsvp__choice input{flex:0 0 auto;width:19px;height:19px;margin:0;accent-color:var(--kevents-accent,#665a50)}
  .kevents-rsvp__conditional{display:grid;gap:18px;padding-top:2px}
  .kevents-rsvp__conditional[hidden]{display:none!important}
  form.kevents-rsvp .kevents-rsvp__submit{display:flex!important;width:100%!important;min-height:50px!important;align-items:center;justify-content:center;margin:4px 0 0!important;padding:11px 20px!important;border:1px solid transparent!important;border-radius:999px!important;background:var(--kevents-accent,#665a50)!important;box-shadow:0 8px 22px color-mix(in srgb,var(--kevents-accent,#665a50) 24%,transparent);color:#fff!important;font:700 14px/1 var(--kevents-sans,Arial,sans-serif)!important;letter-spacing:.04em!important;text-transform:none!important;cursor:pointer;transition:filter .18s ease,transform .18s ease,box-shadow .18s ease}
  form.kevents-rsvp .kevents-rsvp__submit:hover{filter:brightness(.94);transform:translateY(-1px);box-shadow:0 10px 26px color-mix(in srgb,var(--kevents-accent,#665a50) 31%,transparent)}
  form.kevents-rsvp .kevents-rsvp__submit:focus-visible{outline:3px solid color-mix(in srgb,var(--kevents-accent,#665a50) 30%,transparent);outline-offset:3px}
  form.kevents-rsvp .kevents-rsvp__submit:disabled{cursor:wait;filter:saturate(.6);opacity:.72;transform:none}
  .kevents-rsvp__status{display:block;min-height:0;margin:0;padding:0;border-radius:9px;font-size:13px;font-weight:600;line-height:1.45;text-align:center}
  .kevents-rsvp__status:empty{display:none}
  .kevents-rsvp__status:not(:empty){padding:11px 13px}
  .kevents-rsvp__status[data-state="sending"]{background:color-mix(in srgb,var(--kevents-accent,#665a50) 12%,transparent);color:inherit}
  .kevents-rsvp__status[data-state="success"]{background:#1e6b3b14;color:#165b31}
  .kevents-rsvp__status[data-state="error"]{background:#a4313114;color:#8a2525}
  .kevents-rsvp__sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
  @media (max-width:479px){form.kevents-rsvp{font-size:14px}.kevents-rsvp__fields,.kevents-rsvp__conditional{gap:15px}.kevents-rsvp__choices{grid-template-columns:1fr}.kevents-rsvp__choice{min-height:44px}form.kevents-rsvp .kevents-rsvp__control{min-height:46px!important;font-size:16px!important}}
  @media (prefers-reduced-motion:reduce){.kevents-traveling-rose{left:auto!important;right:14px!important;top:auto!important;bottom:14px!important;transform:none!important;transition:none!important}}
</style>
<script id="kevents-local-runtime">
(function () {
  var bridgeToken = '__KEVENTS_BRIDGE_TOKEN__';
  var templateConfig = window.__KEVENTS_TEMPLATE || {};
  var RSVP_SCHEMA_VERSION = 'kevents-rsvp-v1';
  var rsvpFormCount = 0;
  var rsvpRuntimeReady = false;
  var pendingForm = null;
  var pendingRequest = null;

  function hasKeventsParent() {
    return window.parent !== window && bridgeToken !== '__KEVENTS_BRIDGE_' + 'TOKEN__';
  }

  function silenceSourceAudio(root) {
    if (!root || !root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll('audio'), function (audio) {
      audio.pause();
      audio.muted = true;
      audio.volume = 0;
      audio.removeAttribute('autoplay');
      audio.setAttribute('preload', 'none');
    });
  }

  function isHiddenCustomizationVideo(video) {
    if (!video || !video.closest) return false;
    if (templateConfig.slug === 'sacred-garden' && video.closest('#weiVideoWrap')) return true;
    return Boolean(templateConfig.hiddenVideoRecord && video.closest('#rec' + templateConfig.hiddenVideoRecord));
  }

  function disableHiddenVideo(video) {
    if (!isHiddenCustomizationVideo(video)) return;
    video.pause();
    video.muted = true;
    video.removeAttribute('autoplay');
    video.removeAttribute('src');
    video.removeAttribute('poster');
    video.removeAttribute('data-original');
    video.setAttribute('preload', 'none');
    Array.prototype.forEach.call(video.querySelectorAll('source'), function (source) {
      source.removeAttribute('src');
      source.removeAttribute('srcset');
      source.removeAttribute('data-original');
    });
    video.load();
  }

  function removeHiddenVideoSources(root) {
    if (!root || !root.querySelectorAll) return;
    if (root.matches && root.matches('video,source')) disableHiddenVideo(root.closest('video'));
    Array.prototype.forEach.call(root.querySelectorAll('video'), disableHiddenVideo);
  }

  function setupTravelingRose() {
    var rose = document.getElementById('kevents-traveling-rose');
    if (!rose || rose.dataset.keventsReady === 'true') return;
    rose.dataset.keventsReady = 'true';
    var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    rose.style.left = '0';
    rose.style.top = '0';
    rose.style.right = 'auto';
    rose.style.bottom = 'auto';
    rose.style.willChange = 'transform';
    var queued = false;
    function positionRose() {
      queued = false;
      var maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      var size = rose.getBoundingClientRect().width || 56;
      var x = 12 + progress * Math.max(0, window.innerWidth - size - 24);
      var y = window.innerHeight - size - 20 - progress * Math.max(0, window.innerHeight * .48);
      rose.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0) rotate(' + Math.round(-12 + progress * 24) + 'deg)';
    }
    function queuePosition() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(positionRose);
    }
    positionRose();
    window.addEventListener('scroll', queuePosition, { passive: true });
    window.addEventListener('resize', queuePosition, { passive: true });
  }

  function makeVenueCard(frame) {
    if (!templateConfig.venue || !templateConfig.directionsUrl || frame.dataset.keventsReplaced === 'true') return;
    frame.dataset.keventsReplaced = 'true';
    var card = document.createElement('div');
    var content = document.createElement('div');
    var eyebrow = document.createElement('p');
    var title = document.createElement('p');
    var link = document.createElement('a');
    card.className = 'kevents-venue-card';
    eyebrow.className = 'kevents-venue-card__eyebrow';
    eyebrow.textContent = 'Venue & directions';
    title.className = 'kevents-venue-card__title';
    title.textContent = templateConfig.venue;
    link.className = 'kevents-venue-card__link';
    link.href = templateConfig.directionsUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.dataset.keventsDirections = 'true';
    link.textContent = 'Open in Google Maps ↗';
    content.appendChild(eyebrow);
    content.appendChild(title);
    content.appendChild(link);
    card.appendChild(content);
    frame.replaceWith(card);
  }

  function replaceMapFrames(root) {
    if (!root || !root.querySelectorAll) return;
    Array.prototype.forEach.call(root.querySelectorAll('iframe[src*="google.com/maps"],iframe[src*="maps.google"]'), makeVenueCard);
  }

  function applyEditorialDetails() {
    document.documentElement.lang = 'en';
    if (templateConfig.slug) document.body.dataset.keventsTemplate = templateConfig.slug;
    Array.prototype.forEach.call(document.querySelectorAll('[data-elem-type="text"]'), function (element) {
      var declaredSize = parseFloat(element.getAttribute('data-field-fontsize-value') || '0');
      var text = element.textContent.replace(/\\s+/g, ' ').trim();
      if (declaredSize >= 30 || (declaredSize >= 24 && text.length <= 40)) {
        var atom = element.querySelector('.tn-atom');
        if (atom) atom.classList.add('kevents-display');
      }
    });
    Array.prototype.forEach.call(templateConfig.photos || [], function (photo) {
      Array.prototype.forEach.call(document.querySelectorAll('img[src*="' + photo.filename + '"],img[data-original*="' + photo.filename + '"]'), function (image) {
        image.alt = photo.alt;
      });
    });
    removeHiddenVideoSources(document);
    silenceSourceAudio(document);
    replaceMapFrames(document);
    setupTravelingRose();
    rsvpRuntimeReady = true;
    setupRsvpForms(document);
  }

  document.addEventListener('play', function (event) {
    if (!event.target || event.target.tagName !== 'AUDIO') return;
    event.target.muted = true;
    event.target.pause();
  }, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyEditorialDetails);
  else applyEditorialDetails();

  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'attributes') {
        removeHiddenVideoSources(mutation.target);
        return;
      }
      Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
        if (node.nodeType !== 1) return;
        removeHiddenVideoSources(node);
        silenceSourceAudio(node);
        replaceMapFrames(node);
        if (rsvpRuntimeReady) setupRsvpForms(node);
        if (node.matches && node.matches('iframe[src*="google.com/maps"],iframe[src*="maps.google"]')) makeVenueCard(node);
      });
    });
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'poster', 'data-original', 'autoplay']
  });

  function matchingElements(root, selector) {
    var matches = [];
    if (!root) return matches;
    if (root.nodeType === 1 && root.matches && root.matches(selector)) matches.push(root);
    if (root.querySelectorAll) {
      Array.prototype.forEach.call(root.querySelectorAll(selector), function (element) {
        if (matches.indexOf(element) === -1) matches.push(element);
      });
    }
    return matches;
  }

  function isRsvpForm(form) {
    if (!form || form.tagName !== 'FORM') return false;
    if (form.dataset.keventsRsvpSchema === RSVP_SCHEMA_VERSION) return true;
    if (form.closest('[data-elem-type="form"]')) return true;
    var popup = form.closest('.t702,.t-popup');
    return Boolean(popup && /rsvp|attendance|attend|will you/i.test(popup.textContent || ''));
  }

  function rsvpFormMarkup(prefix) {
    return [
      '<p class="kevents-rsvp__intro">A quick reply is all we need.</p>',
      '<div class="kevents-rsvp__fields">',
        '<div class="kevents-rsvp__field">',
          '<label class="kevents-rsvp__label" for="' + prefix + '-name">Full name <span class="kevents-rsvp__required">Required</span></label>',
          '<input class="kevents-rsvp__control" id="' + prefix + '-name" name="name" type="text" autocomplete="name" maxlength="120" required>',
        '</div>',
        '<fieldset class="kevents-rsvp__attendance">',
          '<legend class="kevents-rsvp__legend">Will you be attending? <span class="kevents-rsvp__required">Required</span></legend>',
          '<div class="kevents-rsvp__choices">',
            '<label class="kevents-rsvp__choice" for="' + prefix + '-attending"><input id="' + prefix + '-attending" name="attendance" type="radio" value="attending" required><span>Yes, happily</span></label>',
            '<label class="kevents-rsvp__choice" for="' + prefix + '-declined"><input id="' + prefix + '-declined" name="attendance" type="radio" value="declined" required><span>Sorry, can’t make it</span></label>',
          '</div>',
        '</fieldset>',
        '<div class="kevents-rsvp__conditional" data-kevents-rsvp-when="attending" hidden aria-hidden="true">',
          '<div class="kevents-rsvp__field">',
            '<label class="kevents-rsvp__label" for="' + prefix + '-party-size">How many are attending? <span class="kevents-rsvp__required">Required</span></label>',
            '<input class="kevents-rsvp__control" id="' + prefix + '-party-size" name="partySize" type="number" inputmode="numeric" min="1" max="20" step="1" value="1" required disabled>',
            '<span class="kevents-rsvp__hint">Include yourself in the total.</span>',
          '</div>',
          '<div class="kevents-rsvp__field">',
            '<label class="kevents-rsvp__label" for="' + prefix + '-requirements">Guest details &amp; requirements <span class="kevents-rsvp__hint">Optional</span></label>',
            '<textarea class="kevents-rsvp__control" id="' + prefix + '-requirements" name="requirements" maxlength="1000" aria-describedby="' + prefix + '-requirements-hint" disabled></textarea>',
            '<span class="kevents-rsvp__hint" id="' + prefix + '-requirements-hint">Share additional guest names, children’s names and ages, dietary needs, or accessibility needs.</span>',
          '</div>',
          '<div class="kevents-rsvp__field">',
            '<label class="kevents-rsvp__label" for="' + prefix + '-song">Song request <span class="kevents-rsvp__hint">Optional</span></label>',
            '<input class="kevents-rsvp__control" id="' + prefix + '-song" name="song" type="text" maxlength="160" placeholder="A song that gets you dancing" disabled>',
          '</div>',
        '</div>',
        '<div class="kevents-rsvp__conditional" data-kevents-rsvp-when="declined" hidden aria-hidden="true">',
          '<div class="kevents-rsvp__field">',
            '<label class="kevents-rsvp__label" for="' + prefix + '-message">Leave a message <span class="kevents-rsvp__hint">Optional</span></label>',
            '<textarea class="kevents-rsvp__control" id="' + prefix + '-message" name="message" maxlength="1000" placeholder="Send your wishes to the couple" disabled></textarea>',
          '</div>',
        '</div>',
        '<button class="kevents-rsvp__submit t-submit" type="submit">Send RSVP</button>',
        '<p class="kevents-rsvp__status" role="status" aria-live="polite" aria-atomic="true"></p>',
      '</div>'
    ].join('');
  }

  function setConditionalFields(form) {
    var selected = form.querySelector('input[name="attendance"]:checked');
    var attendance = selected ? selected.value : '';
    Array.prototype.forEach.call(form.querySelectorAll('[data-kevents-rsvp-when]'), function (section) {
      var visible = section.dataset.keventsRsvpWhen === attendance;
      section.hidden = !visible;
      section.setAttribute('aria-hidden', visible ? 'false' : 'true');
      Array.prototype.forEach.call(section.querySelectorAll('input,select,textarea'), function (field) {
        field.disabled = !visible;
      });
    });
  }

  function normalizeRsvpForm(form) {
    if (!isRsvpForm(form)) return;
    if (form.dataset.keventsRsvpSchema === RSVP_SCHEMA_VERSION && form.querySelector('[name="partySize"]')) return;
    rsvpFormCount += 1;
    var prefix = 'kevents-rsvp-' + rsvpFormCount;
    form.classList.add('kevents-rsvp');
    form.dataset.keventsRsvpSchema = RSVP_SCHEMA_VERSION;
    form.setAttribute('aria-label', 'Wedding RSVP');
    form.setAttribute('novalidate', '');
    form.removeAttribute('action');
    form.removeAttribute('method');
    form.innerHTML = rsvpFormMarkup(prefix);
    var shell = form.closest('.t-popup__container,.t702__wrapper');
    if (shell) shell.classList.add('kevents-rsvp-shell');
    var host = form.closest('[data-elem-type="form"]');
    if (host) host.classList.add('kevents-rsvp-host');
    form.addEventListener('change', function (event) {
      if (event.target && event.target.removeAttribute) event.target.removeAttribute('aria-invalid');
      setConditionalFields(form);
    });
    form.addEventListener('input', function (event) {
      if (event.target && event.target.removeAttribute) event.target.removeAttribute('aria-invalid');
      var status = form.querySelector('.kevents-rsvp__status');
      if (status && status.dataset.state === 'error') {
        status.textContent = '';
        delete status.dataset.state;
      }
    });
    setConditionalFields(form);
  }

  function normalizeZeroFormHost(host) {
    if (!host) return;
    var holder = host.querySelector('.tn-atom__form') || host;
    var forms = holder.querySelectorAll('form');
    var form = Array.prototype.find.call(forms, function (candidate) {
      return candidate.dataset.keventsRsvpSchema === RSVP_SCHEMA_VERSION;
    }) || forms[0];
    if (!form) {
      form = document.createElement('form');
      form.className = 't-form';
      holder.appendChild(form);
    }
    normalizeRsvpForm(form);
    Array.prototype.forEach.call(holder.querySelectorAll('form'), function (candidate) {
      if (candidate !== form) candidate.remove();
    });
  }

  function setupRsvpForms(root) {
    var hosts = matchingElements(root, '[data-elem-type="form"]');
    if (root && root.nodeType === 1 && root.closest) {
      var parentHost = root.closest('[data-elem-type="form"]');
      if (parentHost && hosts.indexOf(parentHost) === -1) hosts.push(parentHost);
    }
    hosts.forEach(normalizeZeroFormHost);
    matchingElements(root, 'form').forEach(function (form) {
      if (form.isConnected !== false) normalizeRsvpForm(form);
    });
  }

  function firstInvalidField(form) {
    var fields = form.querySelectorAll('input,select,textarea');
    for (var index = 0; index < fields.length; index += 1) {
      var field = fields[index];
      if (field.disabled) continue;
      field.removeAttribute('aria-invalid');
      var required = field.required || field.getAttribute('data-tilda-req') === '1';
      if (field.type === 'hidden') {
        if (required && field.classList.contains('t-checkboxes__hiddeninput')) {
          var checkboxGroup = field.parentElement && field.parentElement.querySelectorAll('input[type="checkbox"]');
          var groupChecked = checkboxGroup && Array.prototype.some.call(checkboxGroup, function (item) { return item.checked; });
          if (!groupChecked) return checkboxGroup && checkboxGroup[0] ? checkboxGroup[0] : field;
        }
        continue;
      }
      var value = typeof field.value === 'string' ? field.value.trim() : '';
      var missing = false;
      if (required && field.type === 'radio') {
        var group = form.elements[field.name];
        missing = !group || !Array.prototype.some.call(group.length === undefined ? [group] : group, function (item) { return item.checked; });
      } else if (required && field.type === 'checkbox') {
        var wrapper = field.closest('.t-checkboxes__wrapper');
        var checkboxes = wrapper && wrapper.querySelectorAll('input[type="checkbox"]');
        missing = checkboxes
          ? !Array.prototype.some.call(checkboxes, function (item) { return item.checked; })
          : !field.checked;
      } else if (required) {
        missing = !value;
      }
      if (missing || (value && field.validity && !field.validity.valid)) return field;
    }
    return null;
  }

  function notify(message, isError, form) {
    var activeForm = form || pendingForm;
    var inlineStatus = activeForm && activeForm.querySelector('.kevents-rsvp__status');
    if (inlineStatus) {
      inlineStatus.textContent = message;
      inlineStatus.dataset.state = isError ? 'error' : (/sending/i.test(message) ? 'sending' : 'success');
      inlineStatus.setAttribute('role', isError ? 'alert' : 'status');
      inlineStatus.setAttribute('aria-live', isError ? 'assertive' : 'polite');
      return;
    }
    var notice = document.querySelector('.kevents-local-notice');
    if (!notice) {
      notice = document.createElement('div');
      notice.className = 'kevents-local-notice';
      notice.setAttribute('role', 'status');
      notice.setAttribute('aria-live', 'polite');
      document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.dataset.error = isError ? 'true' : 'false';
  }

  function enableForm() {
    if (!pendingForm) return;
    delete pendingForm.dataset.keventsSending;
    pendingForm.removeAttribute('aria-busy');
    Array.prototype.forEach.call(pendingForm.querySelectorAll('[type="submit"],button'), function (control) {
      control.disabled = false;
    });
    pendingForm = null;
  }

  function canonicalRsvpFields(form) {
    var data = new FormData(form);
    var attendance = String(data.get('attendance') || '').trim();
    var fields = {
      rsvpSchema: RSVP_SCHEMA_VERSION,
      name: String(data.get('name') || '').trim(),
      attendance: attendance,
      partySize: '',
      requirements: '',
      song: '',
      message: ''
    };
    if (attendance === 'attending') {
      fields.partySize = String(data.get('partySize') || '').trim();
      fields.requirements = String(data.get('requirements') || '').trim();
      fields.song = String(data.get('song') || '').trim();
    } else if (attendance === 'declined') {
      fields.message = String(data.get('message') || '').trim();
    }
    return fields;
  }

  function submitRsvp(form, event) {
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.keventsSending === 'true') return;

    normalizeRsvpForm(form);
    var invalidField = firstInvalidField(form);
    if (invalidField) {
      invalidField.setAttribute('aria-invalid', 'true');
      invalidField.focus();
      notify('Please complete the required RSVP details.', true, form);
      return;
    }

    var fields = canonicalRsvpFields(form);

    pendingForm = form;
    form.dataset.keventsSending = 'true';
    form.setAttribute('aria-busy', 'true');
    pendingRequest = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    Array.prototype.forEach.call(form.querySelectorAll('[type="submit"],button'), function (control) {
      control.disabled = true;
    });

    if (!hasKeventsParent()) {
      notify('Preview RSVP received. Connect this template through KEvents to deliver it.', false, form);
      enableForm();
      return;
    }

    notify('Sending your RSVP…', false, form);
    window.parent.postMessage({
      source: 'kevents-template',
      type: 'rsvp',
      token: bridgeToken,
      requestId: pendingRequest,
      fields: fields
    }, '*');
  }

  document.addEventListener('submit', function (event) {
    var form = event.target && event.target.closest ? event.target.closest('form') : null;
    submitRsvp(form, event);
  }, true);

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (link && hasKeventsParent()) {
      try {
        var target = new URL(link.href, window.location.href);
        if (link.dataset.keventsDirections === 'true') {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.parent.postMessage({ source: 'kevents-template', type: 'directions', token: bridgeToken, url: target.href }, '*');
          return;
        }
        if (target.hostname === 'webgencyinvitations.com' && target.pathname.replace(/\\/$/, '') === '/order') {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.parent.postMessage({ source: 'kevents-template', type: 'enquire', token: bridgeToken }, '*');
          return;
        }
      } catch (error) {
        // Leave malformed links to the browser.
      }
    }

    var submitter = event.target && event.target.closest
      ? event.target.closest('button[type="submit"],input[type="submit"],.t-submit')
      : null;
    if (!submitter) return;
    var form = submitter.closest('form');
    if (!form) {
      var formBlock = submitter.closest('[data-elem-type="form"],.t-form');
      form = formBlock && formBlock.querySelector('form');
    }
    submitRsvp(form, event);
  }, true);

  window.addEventListener('message', function (event) {
    var message = event.data || {};
    if (event.source !== window.parent || message.source !== 'kevents-host' || message.type !== 'rsvp-result') return;
    if (message.token !== bridgeToken) return;
    if (message.requestId !== pendingRequest) return;
    if (message.ok) {
      notify(message.demo ? 'Demo RSVP received. Connect an RSVP endpoint before publishing.' : 'Thank you — your RSVP was sent.', false, pendingForm);
      if (!message.demo && pendingForm) {
        pendingForm.reset();
        setConditionalFields(pendingForm);
      }
    } else {
      notify('We could not send your RSVP. Please try again.', true, pendingForm);
    }
    enableForm();
  });
}());
</script>`

const generatedStartMarker = '<!-- kevents-generated:start -->'
const generatedEndMarker = '<!-- kevents-generated:end -->'
const travelingRoseMarkup = '<div id="kevents-traveling-rose" class="kevents-traveling-rose" aria-hidden="true"><img src="/images/rose-bloom-cutout.webp" alt="" width="766" height="664" loading="lazy" decoding="async" draggable="false"></div>'

function setTagAttribute(tag, name, value) {
  const attributePattern = new RegExp(`(\\s${escapeRegExp(name)}\\s*=\\s*)(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'i')
  if (attributePattern.test(tag)) {
    return tag.replace(attributePattern, `$1"${value}"`)
  }
  return tag.replace(/\/?>(?=\s*$)/, (ending) => ` ${name}="${value}"${ending}`)
}

function removeTagAttribute(tag, name) {
  const attributePattern = new RegExp(`\\s${escapeRegExp(name)}(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+))?`, 'gi')
  return tag.replace(attributePattern, '')
}

function stripVideoNetworkSources(markup) {
  return markup.replace(/<video\b[^>]*>[\s\S]*?<\/video>/gi, (videoMarkup) => {
    let stripped = videoMarkup.replace(/^<video\b[^>]*>/i, (videoTag) => {
      let updatedTag = videoTag
      for (const attribute of ['autoplay', 'data-original', 'poster', 'src']) {
        updatedTag = removeTagAttribute(updatedTag, attribute)
      }
      return setTagAttribute(updatedTag, 'preload', 'none')
    })
    stripped = stripped.replace(/<source\b[^>]*>/gi, (sourceTag) => {
      let updatedTag = sourceTag
      for (const attribute of ['data-original', 'src', 'srcset']) {
        updatedTag = removeTagAttribute(updatedTag, attribute)
      }
      return updatedTag
    })
    return stripped.replace(/[ \t]+(?=\r?\n)/g, '')
  })
}

function transformRecordHtml(html, recordId, transform) {
  const recordPattern = new RegExp(`<div\\b[^>]*\\bid=(['"])rec${escapeRegExp(String(recordId))}\\1[^>]*>`, 'i')
  const recordMatch = recordPattern.exec(html)
  if (!recordMatch) return html

  const nextRecordPattern = /<div\b[^>]*\bid=(['"])rec\d+\1[^>]*>/gi
  nextRecordPattern.lastIndex = recordMatch.index + recordMatch[0].length
  const nextRecord = nextRecordPattern.exec(html)
  const allRecordsMarker = html.indexOf('<!--/allrecords-->', recordMatch.index)
  const allRecordsClose = allRecordsMarker < 0
    ? -1
    : html.toLowerCase().lastIndexOf('</div>', allRecordsMarker)
  const recordEnd = nextRecord
    ? nextRecord.index
    : allRecordsClose > recordMatch.index
      ? allRecordsClose
      : html.length
  return `${html.slice(0, recordMatch.index)}${transform(html.slice(recordMatch.index, recordEnd))}${html.slice(recordEnd)}`
}

function stripHiddenVideoSources(page, html) {
  const customization = templateCustomizations[page.slug]
  let updatedHtml = html
  if (customization?.heroRecord) {
    updatedHtml = transformRecordHtml(updatedHtml, customization.heroRecord, stripVideoNetworkSources)
  }
  if (page.slug === 'sacred-garden') {
    updatedHtml = updatedHtml.replace(
      /<video\b(?=[^>]*\bid=['"]weiVideo['"])[^>]*>[\s\S]*?<\/video>/gi,
      stripVideoNetworkSources,
    )
  }
  return updatedHtml
}

function removeNativeIntroRecords(page, html) {
  let updatedHtml = html
  for (const recordId of removableNativeIntroRecords.get(page.slug) || []) {
    updatedHtml = transformRecordHtml(updatedHtml, recordId, () => '')
  }
  return updatedHtml
}

function enhanceTemplateImages(page, html) {
  const heroFilename = `${page.slug}-hero.webp`
  let imageIndex = 0
  return html.replace(/<(script|style)\b[\s\S]*?<\/\1>|<img\b[^>]*>/gi, (fragment, inertElement) => {
    if (inertElement) return fragment
    const currentIndex = imageIndex
    imageIndex += 1
    let imageTag = setTagAttribute(fragment, 'decoding', 'async')
    const isEditorialHero = fragment.includes(`../editorial/${heroFilename}`)
    if (currentIndex >= 6 && !isEditorialHero) imageTag = setTagAttribute(imageTag, 'loading', 'lazy')
    return imageTag
  })
}

function addMainLandmark(html) {
  return html.replace(
    /<div\b(?=[^>]*\bid=['"]allrecords['"])[^>]*>/i,
    (tag) => setTagAttribute(tag, 'role', 'main'),
  )
}

function addTravelingRose(html) {
  const withoutExistingRose = html.replace(
    /<div\b(?=[^>]*\bid=['"]kevents-traveling-rose['"])[^>]*>[\s\S]*?<\/div>\s*/gi,
    '',
  )
  const bodyEnd = withoutExistingRose.toLowerCase().lastIndexOf('</body>')
  if (bodyEnd === -1) throw new Error('Template page is missing a closing body tag')
  return `${withoutExistingRose.slice(0, bodyEnd)}${travelingRoseMarkup}${withoutExistingRose.slice(bodyEnd)}`
}

function finalizeTemplateHtml(page, html) {
  let updatedHtml = stripHiddenVideoSources(page, html)
  updatedHtml = removeNativeIntroRecords(page, updatedHtml)
  updatedHtml = enhanceTemplateImages(page, updatedHtml)
  updatedHtml = addMainLandmark(updatedHtml)
  return addTravelingRose(updatedHtml)
}

function generatedMarkup(page) {
  return `${generatedStartMarker}${customizationMarkup(page)}${localRuntime}${generatedEndMarker}`
}

function replaceGeneratedMarkup(page, html) {
  const markedPattern = /<!-- kevents-generated:start -->[\s\S]*?<!-- kevents-generated:end -->/
  if (markedPattern.test(html)) return html.replace(markedPattern, generatedMarkup(page))

  const customizationStart = html.indexOf('<script id="kevents-customization-data">')
  const runtimeStart = html.indexOf('<script id="kevents-local-runtime">')
  if (customizationStart === -1 || runtimeStart === -1) {
    throw new Error(`${page.slug}: generated customization/runtime block is missing`)
  }
  const runtimeEnd = html.indexOf('</script>', runtimeStart)
  if (runtimeEnd === -1) throw new Error(`${page.slug}: generated runtime block is incomplete`)
  return `${html.slice(0, customizationStart)}${generatedMarkup(page)}${html.slice(runtimeEnd + '</script>'.length)}`
}

async function fetchBuffer(url) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: '*/*',
          'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(90_000),
      })

      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`)
      const body = Buffer.from(await response.arrayBuffer())
      if (!body.length) throw new Error('empty response body')

      return {
        body,
        contentType: response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || '',
        finalUrl: response.url,
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

async function loadEditorialFonts() {
  const fontFiles = new Map([
    ['Inter', 'inter-latin.woff2'],
    ['Cormorant Garamond', 'cormorant-latin.woff2'],
    ['Instrument Serif', 'instrument-serif-latin.woff2'],
    ['Bricolage Grotesque', 'bricolage-grotesque-latin.woff2'],
  ])
  await Promise.all([...fontFiles].map(async ([family, filename]) => {
    const body = await readFile(path.join(projectRoot, 'public', 'fonts', filename))
    embeddedFonts.set(family, body.toString('base64'))
  }))
}

async function downloadEditorialPhoto(photo) {
  const destination = path.join(editorialRoot, photo.filename)
  if (reuseAssets) {
    try {
      const cached = await readFile(destination)
      if (cached.length && cached.subarray(0, 4).toString('ascii') === 'RIFF') return cached
    } catch {
      // Download a missing or invalid local editorial image below.
    }
  }

  const { stdout } = await execFileAsync('curl', [
    '--location',
    '--fail',
    '--silent',
    '--show-error',
    '--retry', '3',
    '--user-agent', 'K Events template editor/1.0',
    photo.downloadUrl,
  ], { encoding: null, maxBuffer: 32 * 1024 * 1024 })
  const body = Buffer.from(stdout)
  if (body.length < 1024 || body.subarray(0, 4).toString('ascii') !== 'RIFF' || body.subarray(8, 12).toString('ascii') !== 'WEBP') {
    throw new Error(`Unsplash did not return a valid WebP for ${photo.filename}`)
  }
  await writeFile(destination, body)
  return body
}

function makeAssetName(url, contentType) {
  const parsed = new URL(url)
  let base = path.basename(decodeURIComponent(parsed.pathname)) || 'asset'
  base = base.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'asset'

  const currentExtension = path.extname(base)
  const expectedExtension = contentTypeExtensions.get(contentType) || ''
  if (!currentExtension && expectedExtension) base += expectedExtension
  if (base.length > 72) {
    const extension = path.extname(base)
    base = `${base.slice(0, Math.max(1, 72 - extension.length))}${extension}`
  }

  const digest = createHash('sha1').update(url).digest('hex').slice(0, 12)
  return `${digest}-${base}`
}

async function fetchPage(page) {
  const { body } = await fetchBuffer(page.source)
  const html = preparePageHtml(body.toString('utf8'), page.source)
  pages.set(page.slug, { ...page, html, references: extractAbsoluteUrls(html) })
}

async function downloadAsset(url) {
  const readExisting = async () => {
    const digest = createHash('sha1').update(url).digest('hex').slice(0, 12)
    const existingName = existingAssets.get(digest)
    if (!existingName) return null

    const body = await readFile(path.join(assetRoot, existingName))
    if (!body.length) return null

    const isCss = existingName.endsWith('.css') || new URL(url).pathname.endsWith('.css')
    const text = isCss ? body.toString('utf8') : null
    // Cached CSS has already had its dependency URLs rewritten to sibling files.
    return { url, name: existingName, body, contentType: '', finalUrl: url, text, references: new Map() }
  }

  if (reuseAssets) {
    const existing = await readExisting()
    if (existing) return existing
  }

  try {
    const response = await fetchBuffer(url)
    const name = makeAssetName(url, response.contentType)
    const isCss = response.contentType === 'text/css' || new URL(url).pathname.endsWith('.css')
    const text = isCss ? response.body.toString('utf8') : null
    const references = text ? extractCssUrls(text, response.finalUrl || url) : new Map()
    return { url, name, ...response, text, references }
  } catch (error) {
    const existing = await readExisting()
    if (existing) return existing
    failedAssets.push({ url, error: error.message })
    return null
  }
}

function replaceReference(text, raw, normalized, replacement) {
  return text
    .replaceAll(raw, replacement)
    .replaceAll(normalized, replacement)
    .replaceAll(normalized.replaceAll('&', '&amp;'), replacement)
}

function localizePage(page) {
  let html = page.html
  const references = [...page.references].sort((left, right) => right[1].length - left[1].length)
  for (const [raw, normalized] of references) {
    if (isOriginalAudioUrl(normalized)) {
      html = replaceReference(html, raw, normalized, 'data:audio/mpeg;base64,')
      continue
    }
    const asset = assets.get(normalized)
    if (asset) html = replaceReference(html, raw, normalized, `../assets/${asset.name}`)
  }

  if (page.slug === catalog.slug) {
    for (const template of templates) {
      html = html.replaceAll(`${template.source}/`, `../${template.slug}/index.html`)
      html = html.replaceAll(template.source, `../${template.slug}/index.html`)
      const cover = assets.get(normalizeUrl(template.cover))
      const hero = photosForTemplate(template.slug).find((photo) => photo.role === 'hero')
      if (cover && hero) {
        html = html.replaceAll(`../assets/${cover.name}`, `../editorial/${hero.filename}`)
      }
    }
  } else {
    html = customizePageHtml(page, html)
  }

  const localizedHtml = html.replace(
    /<head>/i,
    `<head><!-- Local mirror generated from ${page.source}. See templates.json for source metadata. -->${generatedMarkup(page)}`,
  )
  return page.slug === catalog.slug ? localizedHtml : finalizeTemplateHtml(page, localizedHtml)
}

async function writeAsset(asset) {
  let body = asset.body
  if (asset.text) {
    let css = asset.text
    for (const [raw, normalized] of asset.references) {
      const dependency = assets.get(normalized)
      if (dependency) css = replaceReference(css, raw, normalized, dependency.name)
    }

    const fontReferences = [...css.matchAll(/url\(\s*(["']?)([^"')]+\.(?:woff2?|ttf|otf)(?:[?#][^"')]+)?)\1\s*\)/gi)]
    for (const match of fontReferences) {
      const reference = match[2]
      if (reference.startsWith('data:')) continue
      const filename = path.basename(reference.split(/[?#]/)[0])
      const extension = path.extname(filename).toLowerCase()
      const mimeType = extension === '.woff2'
        ? 'font/woff2'
        : extension === '.woff'
          ? 'font/woff'
          : extension === '.otf'
            ? 'font/otf'
            : 'font/ttf'
      let fontBody = assetsByName.get(filename)?.body
      if (!fontBody) {
        try {
          fontBody = await readFile(path.join(assetRoot, filename))
        } catch {
          continue
        }
      }
      if (fontBody.length) {
        css = css.replaceAll(reference, `data:${mimeType};base64,${fontBody.toString('base64')}`)
      }
    }
    body = Buffer.from(css)
  } else if (asset.name.endsWith('.js')) {
    // These Tilda helpers either cross the opaque sandbox boundary or fetch optional CDN UI.
    body = Buffer.from(body.toString('utf8')
      .replaceAll('window.parent.isPagePreview', 'false')
      .replaceAll('function t_zeroForms__addResource(t){var', 'function t_zeroForms__addResource(t){return;var'))
  }
  await writeFile(path.join(assetRoot, asset.name), body)
}

async function mapWithConcurrency(items, limit, task) {
  const results = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await task(items[index], index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

async function refreshGeneratedPages() {
  await loadEditorialFonts()
  for (const page of templates) {
    const pagePath = path.join(templateRoot, page.slug, 'index.html')
    const currentHtml = await readFile(pagePath, 'utf8')
    const refreshedHtml = finalizeTemplateHtml(page, replaceGeneratedMarkup(page, currentHtml))
    await writeFile(pagePath, refreshedHtml)
  }
  console.log(`Refreshed generated markup for ${templates.length} templates without network access.`)
}

async function main() {
  await Promise.all([
    mkdir(assetRoot, { recursive: true }),
    mkdir(editorialRoot, { recursive: true }),
    mkdir(coverRoot, { recursive: true }),
    mkdir(path.join(recoveredRoot, 'webgencyinvitations.com'), { recursive: true }),
  ])

  await Promise.all([
    loadEditorialFonts(),
    mapWithConcurrency(editorialPhotos, 4, downloadEditorialPhoto),
  ])

  for (const filename of await readdir(assetRoot)) {
    const digest = filename.match(/^([a-f0-9]{12})-/)?.[1]
    if (digest) existingAssets.set(digest, filename)
  }

  await mapWithConcurrency([catalog, ...templates], 4, fetchPage)

  const queued = new Set()
  const queue = []
  for (const page of pages.values()) {
    for (const normalized of page.references.values()) {
      if (isOriginalAudioUrl(normalized)) continue
      if (!queued.has(normalized)) {
        queued.add(normalized)
        queue.push(normalized)
      }
    }
  }
  for (const template of templates) {
    const normalized = normalizeUrl(template.cover)
    if (normalized && !queued.has(normalized)) {
      queued.add(normalized)
      queue.push(normalized)
    }
  }

  let processed = 0
  while (processed < queue.length) {
    const batch = queue.slice(processed)
    processed = queue.length
    const downloaded = await mapWithConcurrency(batch, 8, downloadAsset)
    for (const asset of downloaded.filter(Boolean)) {
      assets.set(asset.url, asset)
      assetsByName.set(asset.name, asset)
      for (const normalized of asset.references.values()) {
        if (!queued.has(normalized)) {
          queued.add(normalized)
          queue.push(normalized)
        }
      }
    }
  }

  await mapWithConcurrency([...assets.values()], 12, writeAsset)

  if (!reuseAssets) {
    const activeAssetNames = new Set([...assets.values()].map((asset) => asset.name))
    for (const filename of await readdir(assetRoot)) {
      if (!activeAssetNames.has(filename)) await unlink(path.join(assetRoot, filename))
    }
  }

  for (const filename of await readdir(assetRoot)) {
    if (/\.(?:mp3|m4a|aac|ogg)$/i.test(filename)) await unlink(path.join(assetRoot, filename))
  }

  for (const page of pages.values()) {
    const directory = path.join(templateRoot, page.slug)
    await mkdir(directory, { recursive: true })
    await writeFile(path.join(directory, 'index.html'), localizePage(page))
  }

  for (const template of templates) {
    const hero = photosForTemplate(template.slug).find((photo) => photo.role === 'hero')
    if (!hero) throw new Error(`Could not find an editorial cover for ${template.name}`)
    await writeFile(
      path.join(coverRoot, `${template.slug}.webp`),
      await readFile(path.join(editorialRoot, hero.filename)),
    )
  }

  const storedAssetCount = (await readdir(assetRoot)).length
  const manifest = {
    generatedAt: new Date().toISOString(),
    catalog: catalog.source,
    templates: templates.map(({ slug, name, source }) => ({ slug, name, source })),
    photography: editorialPhotos.map(({ slug, role, filename, photographer, photoId, sourcePage }) => ({
      slug,
      role,
      filename,
      photographer,
      photoId,
      sourcePage,
    })),
    downloadedAssets: storedAssetCount,
    failedAssets,
  }
  await writeFile(path.join(templateRoot, 'templates.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(
    path.join(templateRoot, 'photography.json'),
    `${JSON.stringify(manifest.photography, null, 2)}\n`,
  )

  const catalogHtml = localizePage(pages.get(catalog.slug))
  const recoveredHtml = catalogHtml
    .replaceAll('../assets/', '../../public/templates/webgency/assets/')
    .replaceAll('../editorial/', '../../public/templates/webgency/editorial/')
    .replaceAll('../sacred-garden/', '../../public/templates/webgency/sacred-garden/')
    .replaceAll('../blossom-oud/', '../../public/templates/webgency/blossom-oud/')
    .replaceAll('../dolce-vita/', '../../public/templates/webgency/dolce-vita/')
    .replaceAll('../vibrant-vows/', '../../public/templates/webgency/vibrant-vows/')
    .replaceAll('../destination-love/', '../../public/templates/webgency/destination-love/')
    .replaceAll('../eternal-romance/', '../../public/templates/webgency/eternal-romance/')
    .replaceAll('../royal-gold/', '../../public/templates/webgency/royal-gold/')
    .replaceAll('../minimalist/', '../../public/templates/webgency/minimalist/')
  await writeFile(path.join(recoveredRoot, 'webgencyinvitations.com', 'index.html'), recoveredHtml)

  const entryHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="refresh" content="0; url=./webgencyinvitations.com/index.html">
    <title>Webgency Invitations</title>
  </head>
  <body>
    <p><a href="./webgencyinvitations.com/index.html">Open the recovered Webgency Invitations website</a></p>
  </body>
</html>
`
  await writeFile(path.join(recoveredRoot, 'index.html'), entryHtml)

  console.log(`Mirrored ${templates.length} templates and ${storedAssetCount} assets.`)
  if (failedAssets.length) {
    console.warn(`${failedAssets.length} optional assets could not be mirrored; their live URLs were retained.`)
    for (const failure of failedAssets) console.warn(`- ${failure.url}: ${failure.error}`)
  }
}

if (refreshGenerated) await refreshGeneratedPages()
else await main()
