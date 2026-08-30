const AUTH_STORAGE_KEY = 'tell-and-wed:demo-auth:v1'
const AUTH_EVENT = 'tell-and-wed:auth-change'
const SESSION_LIFETIME_MS = 1000 * 60 * 60 * 24 * 30
const PASSWORD_ITERATIONS = 210_000
const MAX_ACCOUNTS_PER_DEVICE = 5
const LEGAL_VERSION = '2026-08-30'

const EMPTY_STATE = Object.freeze({ version: 1, accounts: [], session: null })

export class AuthError extends Error {
  constructor(code, message, fields = {}) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.fields = fields
  }
}

function browserStorage() {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

function normaliseEmail(value) {
  return String(value || '').trim().toLocaleLowerCase('en')
}

function cleanLine(value, maximum = 100) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maximum)
}

function validEmail(value) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u.test(value)
}

function validDate(value) {
  if (!value) return true
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().startsWith(value)
}

function validatePassword(password) {
  const value = String(password || '')
  if (value.length < 10) return 'Use at least 10 characters.'
  if (value.length > 128) return 'Use no more than 128 characters.'
  if (!/[\p{L}]/u.test(value) || !/\d/u.test(value)) return 'Include at least one letter and one number.'
  return ''
}

export function validateSignUp(values = {}) {
  const displayName = cleanLine(values.displayName ?? values.name, 80)
  const email = normaliseEmail(values.email)
  const fields = {}

  if (displayName.length < 2) fields.displayName = 'Enter the name you would like us to use.'
  if (!validEmail(email)) fields.email = 'Enter a valid email address.'
  const passwordMessage = validatePassword(values.password)
  if (passwordMessage) fields.password = passwordMessage
  if (!values.acceptedTerms) fields.acceptedTerms = 'Please accept the Terms and Privacy Notice.'

  return { valid: !Object.keys(fields).length, fields, value: { displayName, email } }
}

export function validateSignIn(values = {}) {
  const email = normaliseEmail(values.email)
  const fields = {}
  if (!validEmail(email)) fields.email = 'Enter a valid email address.'
  if (!String(values.password || '')) fields.password = 'Enter your password.'
  return { valid: !Object.keys(fields).length, fields, value: { email } }
}

function isCredential(value) {
  return value
    && value.algorithm === 'PBKDF2-SHA-256'
    && typeof value.salt === 'string'
    && typeof value.verifier === 'string'
    && Number.isSafeInteger(value.iterations)
    && value.iterations >= 100_000
}

function isAccount(value) {
  return value
    && typeof value.id === 'string'
    && validEmail(normaliseEmail(value.email))
    && value.profile
    && typeof value.profile.displayName === 'string'
    && isCredential(value.credential)
}

function readState() {
  const storage = browserStorage()
  if (!storage) return { ...EMPTY_STATE, accounts: [] }
  try {
    const parsed = JSON.parse(storage.getItem(AUTH_STORAGE_KEY) || 'null')
    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.accounts)) {
      return { ...EMPTY_STATE, accounts: [] }
    }
    const accounts = parsed.accounts.filter(isAccount).slice(0, MAX_ACCOUNTS_PER_DEVICE)
    const session = parsed.session
      && typeof parsed.session.id === 'string'
      && typeof parsed.session.accountId === 'string'
      && typeof parsed.session.expiresAt === 'string'
      ? parsed.session
      : null
    return { version: 1, accounts, session }
  } catch {
    return { ...EMPTY_STATE, accounts: [] }
  }
}

function publicAccount(account) {
  if (!account) return null
  return {
    id: account.id,
    email: account.email,
    profile: {
      displayName: account.profile.displayName,
      partnerName: account.profile.partnerName || '',
      phone: account.profile.phone || '',
      eventDate: account.profile.eventDate || '',
    },
    preferences: {
      inspirationEmails: Boolean(account.preferences?.inspirationEmails),
      planningReminders: Boolean(account.preferences?.planningReminders),
    },
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

function currentAccount(state) {
  if (!state.session) return null
  const expiresAt = Date.parse(state.session.expiresAt)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) return null
  return state.accounts.find((account) => account.id === state.session.accountId) || null
}

function snapshotFromState(state) {
  const account = currentAccount(state)
  return {
    session: account ? { ...state.session } : null,
    user: publicAccount(account),
  }
}

function emitAuthChange(state) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: snapshotFromState(state) }))
}

function writeState(state) {
  const storage = browserStorage()
  if (!storage) {
    throw new AuthError('storage_unavailable', 'Your browser is blocking local storage. Allow site storage and try again.')
  }
  try {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state))
  } catch {
    throw new AuthError('storage_unavailable', 'We could not save this account on your device. Check your privacy or storage settings.')
  }
  emitAuthChange(state)
  return snapshotFromState(state)
}

function cryptoApi() {
  const api = globalThis.crypto
  if (!api?.subtle || !api.getRandomValues) {
    throw new AuthError('crypto_unavailable', 'Secure browser cryptography is unavailable. Try a current browser or a secure connection.')
  }
  return api
}

function bytesToBase64(bytes) {
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary)
}

function base64ToBytes(value) {
  try {
    const binary = atob(value)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
  } catch {
    return new Uint8Array()
  }
}

function randomId(prefix) {
  const api = cryptoApi()
  if (typeof api.randomUUID === 'function') return `${prefix}_${api.randomUUID()}`
  return `${prefix}_${bytesToBase64(api.getRandomValues(new Uint8Array(18))).replace(/[+/=]/g, '')}`
}

async function deriveVerifier(password, salt, iterations = PASSWORD_ITERATIONS) {
  const api = cryptoApi()
  const material = await api.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await api.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    material,
    256,
  )
  return new Uint8Array(bits)
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index]
  return difference === 0
}

async function makeCredential(password) {
  const salt = cryptoApi().getRandomValues(new Uint8Array(16))
  const verifier = await deriveVerifier(password, salt)
  return {
    algorithm: 'PBKDF2-SHA-256',
    iterations: PASSWORD_ITERATIONS,
    salt: bytesToBase64(salt),
    verifier: bytesToBase64(verifier),
  }
}

async function matchesCredential(password, credential) {
  const salt = base64ToBytes(credential.salt)
  const expected = base64ToBytes(credential.verifier)
  if (!salt.length || !expected.length) return false
  const actual = await deriveVerifier(password, salt, credential.iterations)
  return equalBytes(actual, expected)
}

function makeSession(account) {
  const issuedAt = new Date()
  return {
    id: randomId('session'),
    accountId: account.id,
    email: account.email,
    issuedAt: issuedAt.toISOString(),
    expiresAt: new Date(issuedAt.valueOf() + SESSION_LIFETIME_MS).toISOString(),
  }
}

export function readAuth() {
  return snapshotFromState(readState())
}

export function readSession() {
  return readAuth().session
}

export function readProfile() {
  return readAuth().user
}

export async function createAccount(values = {}) {
  const validation = validateSignUp(values)
  if (!validation.valid) throw new AuthError('validation', 'Check the highlighted fields.', validation.fields)

  const state = readState()
  if (state.accounts.some((account) => normaliseEmail(account.email) === validation.value.email)) {
    throw new AuthError('account_exists', 'An account with this email already exists on this device. Sign in instead.', { email: 'This email is already registered on this device.' })
  }
  if (state.accounts.length >= MAX_ACCOUNTS_PER_DEVICE) {
    throw new AuthError('account_limit', 'This device has reached the demo account limit.')
  }

  const now = new Date().toISOString()
  const account = {
    id: randomId('account'),
    email: validation.value.email,
    profile: {
      displayName: validation.value.displayName,
      partnerName: '',
      phone: '',
      eventDate: '',
    },
    preferences: {
      inspirationEmails: Boolean(values.marketing),
      planningReminders: true,
    },
    credential: await makeCredential(values.password),
    createdAt: now,
    updatedAt: now,
    termsAcceptedAt: now,
    legalConsent: {
      termsVersion: LEGAL_VERSION,
      privacyVersion: LEGAL_VERSION,
      acceptedAt: now,
    },
  }

  return writeState({ version: 1, accounts: [...state.accounts, account], session: makeSession(account) })
}

export async function signIn(values = {}) {
  const validation = validateSignIn(values)
  if (!validation.valid) throw new AuthError('validation', 'Check the highlighted fields.', validation.fields)

  const state = readState()
  const account = state.accounts.find((candidate) => normaliseEmail(candidate.email) === validation.value.email)
  const matches = account ? await matchesCredential(values.password, account.credential) : false
  if (!account || !matches) {
    throw new AuthError('invalid_credentials', 'Email or password did not match. Demo accounts only exist on the device where they were created.')
  }

  return writeState({ ...state, session: makeSession(account) })
}

export function signOut() {
  const state = readState()
  return writeState({ ...state, session: null })
}

export function updateProfile(updates = {}) {
  const state = readState()
  const account = currentAccount(state)
  if (!account) throw new AuthError('not_authenticated', 'Sign in to update your profile.')

  const displayName = cleanLine(updates.displayName ?? account.profile.displayName, 80)
  const partnerName = cleanLine(updates.partnerName ?? account.profile.partnerName, 80)
  const phone = cleanLine(updates.phone ?? account.profile.phone, 40)
  const eventDate = cleanLine(updates.eventDate ?? account.profile.eventDate, 10)
  const email = updates.email === undefined ? account.email : normaliseEmail(updates.email)
  const fields = {}
  if (displayName.length < 2) fields.displayName = 'Enter the name you would like us to use.'
  if (!validEmail(email)) fields.email = 'Enter a valid email address.'
  if (!validDate(eventDate)) fields.eventDate = 'Enter a valid date.'
  if (state.accounts.some((candidate) => candidate.id !== account.id && normaliseEmail(candidate.email) === email)) {
    fields.email = 'Another account on this device uses this email.'
  }
  if (Object.keys(fields).length) throw new AuthError('validation', 'Check the highlighted fields.', fields)

  const nextAccount = {
    ...account,
    email,
    profile: { displayName, partnerName, phone, eventDate },
    updatedAt: new Date().toISOString(),
  }
  const accounts = state.accounts.map((candidate) => candidate.id === account.id ? nextAccount : candidate)
  const session = { ...state.session, email }
  return writeState({ ...state, accounts, session })
}

export function updatePreferences(updates = {}) {
  const state = readState()
  const account = currentAccount(state)
  if (!account) throw new AuthError('not_authenticated', 'Sign in to update your preferences.')

  const nextAccount = {
    ...account,
    preferences: {
      inspirationEmails: updates.inspirationEmails === undefined
        ? Boolean(account.preferences?.inspirationEmails)
        : Boolean(updates.inspirationEmails),
      planningReminders: updates.planningReminders === undefined
        ? Boolean(account.preferences?.planningReminders)
        : Boolean(updates.planningReminders),
    },
    updatedAt: new Date().toISOString(),
  }
  const accounts = state.accounts.map((candidate) => candidate.id === account.id ? nextAccount : candidate)
  return writeState({ ...state, accounts })
}

export function deleteAccount() {
  const state = readState()
  const account = currentAccount(state)
  if (!account) throw new AuthError('not_authenticated', 'There is no signed-in account to delete.')
  const accounts = state.accounts.filter((candidate) => candidate.id !== account.id)
  writeState({ ...state, accounts, session: null })
  return { deleted: true, accountId: account.id }
}

export function subscribeAuth(listener) {
  if (typeof window === 'undefined' || typeof listener !== 'function') return () => {}
  const localChange = (event) => listener(event.detail || readAuth())
  const storageChange = (event) => {
    if (event.key === AUTH_STORAGE_KEY) listener(readAuth())
  }
  window.addEventListener(AUTH_EVENT, localChange)
  window.addEventListener('storage', storageChange)
  return () => {
    window.removeEventListener(AUTH_EVENT, localChange)
    window.removeEventListener('storage', storageChange)
  }
}

export { AUTH_EVENT, AUTH_STORAGE_KEY, LEGAL_VERSION }
