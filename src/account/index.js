export { default as AccountPage } from './AccountPage.jsx'
export { default as AuthDialog } from './AuthDialog.jsx'
export { default as ReportDialog, REPORT_CATEGORIES } from './ReportDialog.jsx'
export { default as useAuthSession } from './useAuthSession.js'
export {
  AUTH_EVENT,
  AUTH_STORAGE_KEY,
  LEGAL_VERSION,
  AuthError,
  createAccount,
  deleteAccount,
  readAuth,
  readProfile,
  readSession,
  signIn,
  signOut,
  subscribeAuth,
  updatePreferences,
  updateProfile,
  validateSignIn,
  validateSignUp,
} from './authClient.js'
