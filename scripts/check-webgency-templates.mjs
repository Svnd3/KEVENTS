import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')
const mirrorRoot = path.join(projectRoot, 'public', 'templates', 'webgency')
const assetRoot = path.join(mirrorRoot, 'assets')
const editorialRoot = path.join(mirrorRoot, 'editorial')
const coverRoot = path.join(projectRoot, 'public', 'images', 'webgency')
const travelingRosePath = path.join(projectRoot, 'public', 'images', 'rose-bloom-cutout.webp')
const expectedSlugs = [
  'sacred-garden',
  'blossom-oud',
  'dolce-vita',
  'vibrant-vows',
  'destination-love',
  'eternal-romance',
  'royal-gold',
  'minimalist',
]
const assetHostPattern = /https?:\/\/(?:[^/]+\.)?(?:tildacdn\.(?:net|com)|googleapis\.com|gstatic\.com)[^\s"'<>)]*/gi
const importedAudioPattern = /<(?:audio|source)\b[^>]*\bsrc=["']((?!data:)[^"']+\.(?:mp3|m4a|aac|ogg)(?:[?#][^"']*)?)["'][^>]*>/gi
const untranslatedCopyPattern = /Appuyez pour ouvrir|Serez-vous pr(?:é|\\u00e9)sent|Oui, je serai pr(?:é|\\u00e9)sent|D(?:é|\\u00e9)sol(?:é|\\u00e9)|[\u0600-\u06ff]/i
const unfinishedCopyPattern = /Please RSVP before September 30|\bIll tell you\b|Unfortunately, I (?:can'?t|cannot) :\(|lehenghas|\b08 Barcelona\b|Newly wed[’']s/i
const expectedPhotoRoles = ['hero', 'detail']
const expectedEditorialFilenames = expectedSlugs.flatMap((slug) => (
  expectedPhotoRoles.map((role) => `${slug}-${role}.webp`)
))
const hiddenVideoRecords = new Map([
  ['sacred-garden', '2487446043'],
  ['dolce-vita', '2442650993'],
  ['vibrant-vows', '2049114373'],
  ['royal-gold', '2225136913'],
])

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
const removedNativeIntroRecords = new Map([
  ['sacred-garden', ['2487446003']],
  ['blossom-oud', ['2443433693', '2443433703']],
  ['dolce-vita', ['2442650973', '2442650983']],
  ['vibrant-vows', ['2052880283', '2052873013']],
  ['destination-love', ['2132511073']],
  ['eternal-romance', ['1875002831']],
  ['royal-gold', ['2225137013']],
  ['minimalist', ['2072082223', '2072083833']],
])
const failures = []
let checkedReferences = 0

function fail(message) {
  failures.push(message)
}

function isNonemptyFile(filePath) {
  return existsSync(filePath) && statSync(filePath).isFile() && statSync(filePath).size > 0
}

function readJson(filePath, label) {
  if (!existsSync(filePath)) {
    fail(`Missing ${label}: ${filePath}`)
    return null
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (error) {
    fail(`Invalid ${label}: ${error.message}`)
    return null
  }
}

function readWebpDimensions(filePath) {
  const contents = readFileSync(filePath)
  if (
    contents.length < 30 ||
    contents.toString('ascii', 0, 4) !== 'RIFF' ||
    contents.toString('ascii', 8, 12) !== 'WEBP'
  ) return null

  let offset = 12
  while (offset + 8 <= contents.length) {
    const type = contents.toString('ascii', offset, offset + 4)
    const size = contents.readUInt32LE(offset + 4)
    const payload = offset + 8

    if (type === 'VP8X' && payload + 10 <= contents.length) {
      return {
        width: 1 + contents.readUIntLE(payload + 4, 3),
        height: 1 + contents.readUIntLE(payload + 7, 3),
      }
    }
    if (
      type === 'VP8 ' &&
      payload + 10 <= contents.length &&
      contents[payload + 3] === 0x9d &&
      contents[payload + 4] === 0x01 &&
      contents[payload + 5] === 0x2a
    ) {
      return {
        width: contents.readUInt16LE(payload + 6) & 0x3fff,
        height: contents.readUInt16LE(payload + 8) & 0x3fff,
      }
    }
    if (type === 'VP8L' && payload + 5 <= contents.length && contents[payload] === 0x2f) {
      return {
        width: 1 + contents[payload + 1] + ((contents[payload + 2] & 0x3f) << 8),
        height: 1 + ((contents[payload + 2] & 0xc0) >> 6) +
          (contents[payload + 3] << 2) + ((contents[payload + 4] & 0x0f) << 10),
      }
    }

    offset = payload + size + (size % 2)
  }
  return null
}

function markupWithoutInertContent(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
}

function findRecordHtml(html, recordId) {
  const recordPattern = new RegExp(`<div\\b[^>]*\\bid=(['"])rec${recordId}\\1[^>]*>`, 'i')
  const recordMatch = recordPattern.exec(html)
  if (!recordMatch) return null
  const nextRecordPattern = /<div\b[^>]*\bid=(['"])rec\d+\1[^>]*>/gi
  nextRecordPattern.lastIndex = recordMatch.index + recordMatch[0].length
  const nextRecord = nextRecordPattern.exec(html)
  return html.slice(recordMatch.index, nextRecord ? nextRecord.index : html.length)
}

function videoHasNetworkSource(videoMarkup) {
  const videoTag = videoMarkup.match(/^<video\b[^>]*>/i)?.[0] || ''
  if (/\s(?:src|poster|data-original)\s*=/i.test(videoTag)) return true
  return [...videoMarkup.matchAll(/<source\b[^>]*>/gi)].some((match) => (
    /\s(?:src|srcset|data-original)\s*=/i.test(match[0])
  ))
}

const templateHtml = new Map()

if (!isNonemptyFile(travelingRosePath)) fail(`Missing traveling rose asset: ${travelingRosePath}`)

for (const slug of ['catalog', ...expectedSlugs]) {
  const pagePath = path.join(mirrorRoot, slug, 'index.html')
  if (!existsSync(pagePath)) {
    fail(`Missing page: ${pagePath}`)
    continue
  }

  const html = readFileSync(pagePath, 'utf8')
  const runtimeHtml = html.replace(/<!--[\s\S]*?-->/g, '')
  if (slug !== 'catalog') templateHtml.set(slug, html)
  if (!html.includes('id="kevents-local-runtime"')) fail(`${slug}: local runtime is missing`)
  if (!html.includes('Content-Security-Policy')) fail(`${slug}: content security policy is missing`)
  if (!html.includes("connect-src 'none'") || !html.includes("form-action 'none'")) fail(`${slug}: outbound requests are not blocked`)
  if (!html.includes('__KEVENTS_BRIDGE_TOKEN__')) fail(`${slug}: preview bridge token is missing`)
  if (/sessionStorage/i.test(runtimeHtml)) fail(`${slug}: sandbox-incompatible session storage remains`)
  if (/data-field-receivers-value=["'][^"']+["']/i.test(html)) fail(`${slug}: original form receiver is still configured`)
  if (/tilda-stat-1\.0|stat\.tildaapi\./i.test(runtimeHtml)) fail(`${slug}: original analytics is still active`)
  if (slug !== 'catalog') {
    if (!/<html\b[^>]*\blang=["']en["']/i.test(html)) fail(`${slug}: html language is not English`)
    if (!html.includes('id="kevents-customization-data"')) fail(`${slug}: customization marker is missing`)
    if (!html.includes('<!-- kevents-generated:start -->') || !html.includes('<!-- kevents-generated:end -->')) {
      fail(`${slug}: generated block markers are missing`)
    }
    if (!html.includes('"hiddenVideoRecord":')) fail(`${slug}: hidden-video configuration is missing`)
    if (!html.includes('function removeHiddenVideoSources(root)')) fail(`${slug}: hidden-video runtime cleanup is missing`)
    if (!html.includes('attributes: true') || !html.includes("attributeFilter: ['src', 'srcset', 'poster', 'data-original', 'autoplay']")) {
      fail(`${slug}: hidden-video source mutation guard is missing`)
    }
    if (!html.includes("textContent.replace(/\\s+/g, ' ')")) fail(`${slug}: whitespace normalization regex is malformed`)
    if (html.includes("textContent.replace(/s+/g, ' ')")) fail(`${slug}: broken whitespace normalization regex remains`)
    if (!html.includes('function setupTravelingRose()')) fail(`${slug}: traveling rose runtime is missing`)
    if (!html.includes('@media (prefers-reduced-motion:reduce)')) fail(`${slug}: traveling rose does not respect reduced motion`)
    if (!html.includes("var RSVP_SCHEMA_VERSION = 'kevents-rsvp-v1'")) fail(`${slug}: canonical RSVP schema version is missing`)
    if (!html.includes('function setupRsvpForms(root)')) fail(`${slug}: canonical RSVP normalizer is missing`)
    if (!html.includes('function normalizeZeroFormHost(host)')) fail(`${slug}: dynamic zero-form normalization is missing`)
    if (!html.includes('function canonicalRsvpFields(form)')) fail(`${slug}: canonical RSVP serializer is missing`)
    if (!html.includes('class="kevents-rsvp__status" role="status" aria-live="polite"')) fail(`${slug}: inline RSVP status is missing`)
    if (!html.includes('if (rsvpRuntimeReady) setupRsvpForms(node);')) fail(`${slug}: dynamically inserted RSVP forms are not normalized`)
    if (
      !html.includes('name="attendance" type="radio" value="attending" required') ||
      !html.includes('name="attendance" type="radio" value="declined" required')
    ) {
      fail(`${slug}: RSVP attendance is not an exclusive required choice`)
    }
    const expectedRsvpFields = ['name', 'attendance', 'partySize', 'requirements', 'song', 'message']
    const generatedBlock = html.match(/<!-- kevents-generated:start -->[\s\S]*?<!-- kevents-generated:end -->/)?.[0] || ''
    const generatedRsvpFields = new Set(
      [...generatedBlock.matchAll(/<(?:input|select|textarea)\b[^>]*\bname="([^"]+)"/gi)].map((match) => match[1]),
    )
    for (const fieldName of expectedRsvpFields) {
      if (!html.includes(`name="${fieldName}"`)) fail(`${slug}: canonical RSVP field ${fieldName} is missing`)
    }
    for (const fieldName of generatedRsvpFields) {
      if (!expectedRsvpFields.includes(fieldName)) fail(`${slug}: unexpected RSVP field ${fieldName} is present`)
    }
    if (!html.includes('name="name" type="text" autocomplete="name" maxlength="120" required')) {
      fail(`${slug}: RSVP name is not required`)
    }
    if (!html.includes('name="partySize" type="number" inputmode="numeric" min="1" max="20" step="1" value="1" required disabled')) {
      fail(`${slug}: conditional RSVP party size is not required`)
    }
    if (!html.includes('data-kevents-rsvp-when="attending"') || !html.includes('data-kevents-rsvp-when="declined"')) {
      fail(`${slug}: RSVP conditional field groups are missing`)
    }
    if (!html.includes('form.kevents-rsvp .kevents-rsvp__control') || !html.includes('form.kevents-rsvp .kevents-rsvp__submit')) {
      fail(`${slug}: canonical RSVP styling is missing`)
    }
    if (html.includes('new FormData(form).forEach(function (value, key)')) {
      fail(`${slug}: legacy arbitrary RSVP field serialization remains`)
    }

    const openerSelectors = nativeIntroSelectors.get(slug) || []
    if (!html.includes(`${openerSelectors.join(',')}{display:none!important}`)) {
      fail(`${slug}: native intro is not disabled`)
    }
    if (slug === 'royal-gold' && !html.includes('body.loading{overflow:auto!important}')) {
      fail(`${slug}: native loading scroll lock is not disabled`)
    }
    if (slug === 'sacred-garden' && !html.includes('#rec2487446043 .js-delay-anim{opacity:1!important;transform:none!important}')) {
      fail(`${slug}: content reveal still depends on the removed native intro`)
    }

    const markupHtml = markupWithoutInertContent(html)
    for (const recordId of removedNativeIntroRecords.get(slug) || []) {
      if (new RegExp(`<div\\b[^>]*\\bid=["']rec${recordId}["']`, 'i').test(markupHtml)) {
        fail(`${slug}: redundant native intro record ${recordId} remains`)
      }
    }
    const mainTag = markupHtml.match(/<div\b(?=[^>]*\bid=["']allrecords["'])[^>]*>/i)?.[0]
    if (!mainTag || !/\srole=["']main["']/i.test(mainTag)) fail(`${slug}: #allrecords is not a main landmark`)

    const roseCount = [...markupHtml.matchAll(/\bid=["']kevents-traveling-rose["']/gi)].length
    if (roseCount !== 1) fail(`${slug}: expected one traveling rose, found ${roseCount}`)
    if (!/<div\b(?=[^>]*\bid=["']kevents-traveling-rose["'])(?=[^>]*\baria-hidden=["']true["'])[^>]*>/i.test(markupHtml)) {
      fail(`${slug}: traveling rose is not decorative for assistive technology`)
    }
    if (!/<img\b(?=[^>]*\bsrc=["']\/images\/rose-bloom-cutout\.webp["'])(?=[^>]*\bloading=["']lazy["'])(?=[^>]*\bdecoding=["']async["'])[^>]*>/i.test(markupHtml)) {
      fail(`${slug}: traveling rose image markup is incomplete`)
    }

    const imageTags = [...markupHtml.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0])
    imageTags.forEach((imageTag, index) => {
      if (!/\sdecoding=["']async["']/i.test(imageTag)) fail(`${slug}: image ${index + 1} does not decode asynchronously`)
      const isEditorialHero = imageTag.includes(`../editorial/${slug}-hero.webp`)
      if (index >= 6 && !isEditorialHero && !/\sloading=["']lazy["']/i.test(imageTag)) {
        fail(`${slug}: below-fold image ${index + 1} is not lazy-loaded`)
      }
    })

    const hiddenVideoRecord = hiddenVideoRecords.get(slug)
    if (hiddenVideoRecord) {
      const recordHtml = findRecordHtml(markupHtml, hiddenVideoRecord)
      if (!recordHtml) fail(`${slug}: hidden video record ${hiddenVideoRecord} is missing`)
      else {
        for (const video of recordHtml.matchAll(/<video\b[^>]*>[\s\S]*?<\/video>/gi)) {
          if (videoHasNetworkSource(video[0])) fail(`${slug}: hidden video record ${hiddenVideoRecord} still has a network source`)
        }
      }
    }
    if (untranslatedCopyPattern.test(html)) fail(`${slug}: untranslated invitation copy remains`)
    if (unfinishedCopyPattern.test(html)) fail(`${slug}: unfinished invitation copy remains`)
  }

  for (const match of runtimeHtml.matchAll(importedAudioPattern)) {
    fail(`${slug}: imported audio source remains: ${match[1]}`)
  }

  for (const match of html.matchAll(/\.\.\/assets\/([a-zA-Z0-9._-]+)/g)) {
    checkedReferences += 1
    const assetPath = path.join(assetRoot, match[1])
    if (!existsSync(assetPath)) fail(`${slug}: missing asset ${match[1]}`)
    else if (statSync(assetPath).size === 0) fail(`${slug}: empty asset ${match[1]}`)
  }

  for (const match of runtimeHtml.matchAll(assetHostPattern)) {
    fail(`${slug}: remote runtime dependency ${match[0]}`)
  }
}

const assetFilenames = readdirSync(assetRoot)
for (const filename of assetFilenames.filter((name) => /\.(?:mp3|m4a|aac|ogg)$/i.test(name))) {
  fail(`Imported audio asset remains: ${filename}`)
}
for (const filename of assetFilenames) {
  if (statSync(path.join(assetRoot, filename)).size === 0) fail(`Empty orphan asset: ${filename}`)
}

for (const filename of assetFilenames.filter((name) => name.endsWith('.css'))) {
  const cssPath = path.join(assetRoot, filename)
  const css = readFileSync(cssPath, 'utf8')
  const runtimeCss = css.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const match of runtimeCss.matchAll(assetHostPattern)) {
    fail(`${filename}: remote CSS dependency ${match[0]}`)
  }
  for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
    const reference = match[1].trim()
    if (!reference || /^(?:data:|https?:|#)/i.test(reference)) continue
    if (/\.(?:woff2?|ttf|otf)(?:[?#]|$)/i.test(reference)) fail(`${filename}: font is not embedded for the isolated preview: ${reference}`)
    checkedReferences += 1
    const dependencyPath = path.resolve(assetRoot, reference.split(/[?#]/)[0])
    if (!existsSync(dependencyPath)) fail(`${filename}: missing CSS dependency ${reference}`)
    else if (statSync(dependencyPath).size === 0) fail(`${filename}: empty CSS dependency ${reference}`)
  }
}

for (const filename of assetFilenames.filter((name) => name.endsWith('.js'))) {
  const script = readFileSync(path.join(assetRoot, filename), 'utf8')
  if (script.includes('window.parent.isPagePreview')) fail(`${filename}: unsafe parent access remains`)
  if (script.includes('function t_zeroForms__addResource(t){var')) fail(`${filename}: optional CDN resource loader remains active`)
}

const manifest = readJson(path.join(mirrorRoot, 'templates.json'), 'templates.json manifest')
if (manifest) {
  if (manifest.downloadedAssets !== assetFilenames.length) fail('Manifest asset count does not match the mirror')
  if (manifest.failedAssets?.length) fail(`Manifest contains ${manifest.failedAssets.length} failed asset download(s)`)
}

const editorialFilenames = existsSync(editorialRoot)
  ? readdirSync(editorialRoot).filter((name) => name.endsWith('.webp')).sort()
  : []
if (editorialFilenames.length !== expectedEditorialFilenames.length) {
  fail(`Expected ${expectedEditorialFilenames.length} editorial photos, found ${editorialFilenames.length}`)
}
for (const filename of editorialFilenames) {
  if (!expectedEditorialFilenames.includes(filename)) fail(`Unexpected editorial photo: ${filename}`)
}
for (const slug of expectedSlugs) {
  const html = templateHtml.get(slug) || ''
  for (const role of expectedPhotoRoles) {
    const filename = `${slug}-${role}.webp`
    const photoPath = path.join(editorialRoot, filename)
    if (!isNonemptyFile(photoPath)) fail(`Missing editorial photo: ${filename}`)
    if (!html.includes(`../editorial/${filename}`)) fail(`${slug}: editorial ${role} photo is not referenced`)
  }
}

const photography = readJson(path.join(mirrorRoot, 'photography.json'), 'photography.json')
if (photography && !Array.isArray(photography)) fail('photography.json must contain an array')
if (Array.isArray(photography)) {
  if (photography.length !== expectedEditorialFilenames.length) {
    fail(`photography.json contains ${photography.length} entries; expected ${expectedEditorialFilenames.length}`)
  }
  for (const slug of expectedSlugs) {
    for (const role of expectedPhotoRoles) {
      const matches = photography.filter((photo) => photo.slug === slug && photo.role === role)
      if (matches.length !== 1) {
        fail(`photography.json must contain one ${slug}/${role} entry; found ${matches.length}`)
        continue
      }
      const photo = matches[0]
      const expectedFilename = `${slug}-${role}.webp`
      if (photo.filename !== expectedFilename) fail(`photography.json ${slug}/${role} has filename ${photo.filename}`)
      if (!photo.photographer || !photo.photoId) fail(`photography.json ${slug}/${role} is missing attribution metadata`)
      if (!/^https:\/\/unsplash\.com\/photos\/[^/]+\/?$/i.test(photo.sourcePage || '')) {
        fail(`photography.json ${slug}/${role} has an invalid sourcePage`)
      }
    }
  }
  if (manifest && JSON.stringify(manifest.photography) !== JSON.stringify(photography)) {
    fail('templates.json photography metadata does not match photography.json')
  }
}

const coverFilenames = existsSync(coverRoot)
  ? readdirSync(coverRoot).filter((name) => name.endsWith('.webp')).sort()
  : []
if (coverFilenames.length !== expectedSlugs.length) {
  fail(`Expected ${expectedSlugs.length} Webgency covers, found ${coverFilenames.length}`)
}
for (const slug of expectedSlugs) {
  const coverPath = path.join(coverRoot, `${slug}.webp`)
  if (!isNonemptyFile(coverPath)) {
    fail(`Missing cover: ${slug}.webp`)
    continue
  }
  const dimensions = readWebpDimensions(coverPath)
  if (!dimensions) fail(`Invalid WebP cover: ${slug}.webp`)
  else if (dimensions.width < 720 || dimensions.height < 800) {
    fail(`${slug}.webp has dimensions ${dimensions.width}x${dimensions.height}; expected at least 720x800`)
  }
}

if (failures.length) {
  console.error(`Webgency mirror check failed with ${failures.length} issue(s):`)
  failures.slice(0, 100).forEach((failure) => console.error(`- ${failure}`))
  if (failures.length > 100) console.error(`- …and ${failures.length - 100} more`)
  process.exitCode = 1
} else {
  console.log(`Webgency mirror check passed: 8 templates, 16 editorial photos, 8 covers, ${checkedReferences} local references.`)
}
