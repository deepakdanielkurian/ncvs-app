import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase'
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

const AuthContext = createContext()
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null)
  const [role, setRole]     = useState(null)   // 'admin' | 'treasurer'
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u)
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          setRole(snap.exists() ? snap.data().role : 'treasurer')
        } catch { setRole('treasurer') }
      } else {
        setUser(null)
        setRole(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login  = (email, pw) => signInWithEmailAndPassword(auth, email, pw)
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
