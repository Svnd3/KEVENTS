import { useCallback, useEffect, useState } from 'react'
import {
  createAccount,
  deleteAccount,
  readAuth,
  signIn,
  signOut,
  subscribeAuth,
  updatePreferences,
  updateProfile,
} from './authClient.js'

export default function useAuthSession() {
  const [auth, setAuth] = useState(readAuth)

  useEffect(() => subscribeAuth(setAuth), [])

  const refresh = useCallback(() => {
    const next = readAuth()
    setAuth(next)
    return next
  }, [])

  useEffect(() => {
    if (!auth.session?.expiresAt) return undefined
    let timer
    const checkExpiry = () => {
      const remaining = Date.parse(auth.session.expiresAt) - Date.now()
      if (remaining <= 0) {
        refresh()
        return
      }
      // Re-check daily so sessions longer than the browser's maximum timeout
      // cannot remain visually signed in after they expire.
      timer = window.setTimeout(checkExpiry, Math.min(remaining, 86_400_000))
    }
    checkExpiry()
    return () => window.clearTimeout(timer)
  }, [auth.session?.expiresAt, refresh])

  return {
    ...auth,
    authenticated: Boolean(auth.user && auth.session),
    refresh,
    createAccount,
    signIn,
    signOut,
    updateProfile,
    updatePreferences,
    deleteAccount,
  }
}
