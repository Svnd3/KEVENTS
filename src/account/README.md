# Account UI integration

Import the feature from `src/account/index.js`:

```jsx
import {
  AccountPage,
  AuthDialog,
  ReportDialog,
  useAuthSession,
} from './account/index.js'
```

`useAuthSession()` returns `{ user, session, authenticated, createAccount,
signIn, signOut, updateProfile, updatePreferences, deleteAccount, refresh }`.
The auth functions return `{ user, session }` (except `deleteAccount`).

```jsx
const auth = useAuthSession()

<AuthDialog
  open={authOpen}
  mode="sign-in" // or "sign-up"
  onClose={() => setAuthOpen(false)}
  onAuthenticated={({ user, session }) => {
    setAuthOpen(false)
    navigate('account')
  }}
/>

<AccountPage
  user={auth.user}
  savedDesigns={savedDesigns}
  onNavigate={(page) => navigate(page)}
  onSignOut={({ deleted }) => navigate('home')}
  onOpenAuth={(mode) => openAuth(mode)}
  onReport={() => setReportOpen(true)}
  currencySummary={{ label: 'KSh (KES)', country: 'Kenya' }}
/>

<ReportDialog
  open={reportOpen}
  onClose={() => setReportOpen(false)}
  user={auth.user}
/>
```

`AccountPage` also accepts optional `orders`, `enquiries`, and `onUserChange`
props. Without supplied activity, it deliberately shows honest placeholders.

This is a browser-only demonstration. It stores profiles, a 30-day session, and
salted PBKDF2 password verifiers under `tell-and-wed:demo-auth:v1`; it never
stores plaintext passwords. Replace `authClient.js` with server-side auth before
production. Reports POST JSON to `VITE_REPORT_ENDPOINT` when configured and
create a clearly labelled, unsent demo receipt otherwise.
