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
    photos: photos.map(({ filename, alt }) => ({ filename, alt })),
  }).replaceAll('<', '\\u003c')

  const heroRecordCss = customization.heroRecord && hero
    ? `#rec${customization.heroRecord} .t396__carrier{background-image:linear-gradient(180deg,rgba(22,16,19,.12),rgba(22,16,19,.42)),url("../editorial/${hero.filename}")!important;background-position:center!important;background-size:cover!important}#rec${customization.heroRecord} video,#rec${customization.heroRecord} canvas{opacity:0!important;pointer-events:none!important}#rec${customization.heroRecord} img[src*="Gemini"],#rec${customization.heroRecord} img[data-original*="Gemini"]{opacity:0!important}`
    : ''
  const openerCss = page.slug === 'sacred-garden'
    ? '#weiImg{width:100%!important;height:100%!important;max-width:none!important;object-fit:cover!important}'
    : ''

  return `<script id="kevents-customization-data">window.__KEVENTS_TEMPLATE=${data};</script>
<style id="kevents-customization-style">
  @font-face{font-family:'K Events Sans';src:url(data:font/woff2;base64,${inter}) format('woff2');font-style:normal;font-weight:100 900;font-display:swap}
  @font-face{font-family:'K Events Display';src:url(data:font/woff2;base64,${display}) format('woff2');font-style:normal;font-weight:300 700;font-display:swap}
  :root{--kevents-accent:${accent};--kevents-display:'K Events Display',Georgia,serif;--kevents-sans:'K Events Sans',Arial,sans-serif}
  .kevents-display{font-family:var(--kevents-display)!important;font-kerning:normal!important;letter-spacing:-.018em}
  input,select,textarea,.t-submit,button{font-family:var(--kevents-sans)!important}
  img[src*="../editorial/"],img[data-original*="../editorial/"]{object-fit:cover}
  ${heroRecordCss}
  ${openerCss}
</style>`
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
</style>
<script id="kevents-local-runtime">
(function () {
  var bridgeToken = '__KEVENTS_BRIDGE_TOKEN__';
  var templateConfig = window.__KEVENTS_TEMPLATE || {};
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
      var text = element.textContent.replace(/\s+/g, ' ').trim();
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
    silenceSourceAudio(document);
    replaceMapFrames(document);
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
      Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
        if (node.nodeType !== 1) return;
        silenceSourceAudio(node);
        replaceMapFrames(node);
        if (node.matches && node.matches('iframe[src*="google.com/maps"],iframe[src*="maps.google"]')) makeVenueCard(node);
      });
    });
  }).observe(document.documentElement, { childList: true, subtree: true });

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

  function notify(message, isError) {
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
    Array.prototype.forEach.call(pendingForm.querySelectorAll('[type="submit"],button'), function (control) {
      control.disabled = false;
    });
    pendingForm = null;
  }

  function submitRsvp(form, event) {
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.keventsSending === 'true') return;

    var invalidField = firstInvalidField(form);
    if (invalidField) {
      invalidField.setAttribute('aria-invalid', 'true');
      invalidField.focus();
      notify('Please complete the required RSVP details.', true);
      return;
    }

    var fields = {};
    new FormData(form).forEach(function (value, key) {
      if (typeof value !== 'string' || !value.trim()) return;
      if (/^(?:tildaspec-|form-spec-|formservices|formid|formname|formprojectid)/i.test(key)) return;
      fields[key] = fields[key] ? fields[key] + ', ' + value.trim() : value.trim();
    });

    pendingForm = form;
    form.dataset.keventsSending = 'true';
    pendingRequest = String(Date.now()) + '-' + Math.random().toString(36).slice(2);
    Array.prototype.forEach.call(form.querySelectorAll('[type="submit"],button'), function (control) {
      control.disabled = true;
    });

    if (!hasKeventsParent()) {
      notify('Preview RSVP received. Connect this template through KEvents to deliver it.');
      enableForm();
      return;
    }

    notify('Sending your RSVP…');
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
      notify(message.demo ? 'Demo RSVP received. Connect an RSVP endpoint before publishing.' : 'Thank you — your RSVP was sent.');
      if (!message.demo && pendingForm) pendingForm.reset();
    } else {
      notify('We could not send your RSVP. Please try again.', true);
    }
    enableForm();
  });
}());
</script>`

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

  return html.replace(
    /<head>/i,
    `<head><!-- Local mirror generated from ${page.source}. See templates.json for source metadata. -->${customizationMarkup(page)}${localRuntime}`,
  )
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

await main()
