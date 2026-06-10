import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  getDocs, where, serverTimestamp, getDoc
} from 'firebase/firestore'
import { todayStr } from '../utils/helpers'

const AppContext = createContext()
export const useApp = () => useContext(AppContext)

const SESSION_KEY = 'ncvs_session'

export function AppProvider({ children }) {
  // ── Auth ──
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
  })
  const [authLoading, setAuthLoading] = useState(false)

  // ── Data ──
  const [entries, setEntries]     = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [customPay, setCustomPay] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ncvs_custom_pay') || '[]') } catch { return [] }
  })

  // ── Toast ──
  const [toast, setToast]     = useState({ msg: '', show: false })
  const [toastTimer, setTimer] = useState(null)

  const showToast = useCallback((msg) => {
    if (toastTimer) clearTimeout(toastTimer)
    setToast({ msg, show: true })
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 2600)
    setTimer(t)
  }, [toastTimer])

  // ── Custom pay methods ──
  const saveCustomPay = list => {
    setCustomPay(list)
    localStorage.setItem('ncvs_custom_pay', JSON.stringify(list))
  }
  const addCustomPay = method => {
    if (!method.trim() || customPay.includes(method.trim())) return false
    saveCustomPay([...customPay, method.trim()])
    return true
  }
  const removeCustomPay = method => saveCustomPay(customPay.filter(m => m !== method))

  // ── Custom auth ──
  const login = async (username, password) => {
    setAuthLoading(true)
    try {
      const snap = await getDocs(
        query(collection(db, 'users'),
          where('username', '==', username.trim()),
          where('password', '==', password)
        )
      )
      if (snap.empty) {
        setAuthLoading(false)
        return { ok: false, error: 'Invalid username or password' }
      }
      const u = { id: snap.docs[0].id, ...snap.docs[0].data() }
      const session = { id: u.id, username: u.username, name: u.name, role: u.role }
      setUser(session)
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setAuthLoading(false)
      return { ok: true }
    } catch {
      setAuthLoading(false)
      return { ok: false, error: 'Connection error. Check internet.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  // ── Real-time listener for entries ──
  useEffect(() => {
    if (!user) { setDataLoading(false); return }
    setDataLoading(true)
    const unsub = onSnapshot(
      query(collection(db, 'entries'), orderBy('createdAt', 'desc')),
      snap => {
        setEntries(snap.docs.map(d => ({ ...d.data(), id: d.id })))
        setDataLoading(false)
      },
      () => setDataLoading(false)
    )
    return unsub
  }, [user])

  // ── Entries CRUD ──
  const addEntry = data =>
    addDoc(collection(db, 'entries'), {
      ...data, createdAt: serverTimestamp(), createdBy: user?.username || ''
    })

  const updateEntry = (id, data) =>
    updateDoc(doc(db, 'entries', id), {
      ...data, updatedAt: serverTimestamp(), updatedBy: user?.username || ''
    })

  const deleteEntry = id => deleteDoc(doc(db, 'entries', id))

  // ── Admin ──
  const createUser = async ({ username, password, name, role }) => {
    const exists = await getDocs(query(collection(db, 'users'), where('username', '==', username.trim())))
    if (!exists.empty) throw new Error('Username already exists')
    await addDoc(collection(db, 'users'), {
      username: username.trim(), password, name: name.trim(), role,
      createdAt: serverTimestamp()
    })
  }

  const getUsers = async () => {
    const snap = await getDocs(collection(db, 'users'))
    return snap.docs.map(d => ({ id: d.id, ...d.data(), password: '\u2022\u2022\u2022\u2022\u2022\u2022' }))
  }

  const deleteUser = id => deleteDoc(doc(db, 'users', id))

  return (
    <AppContext.Provider value={{
      user, role: user?.role || null, authLoading, login, logout,
      entries, dataLoading,
      addEntry, updateEntry, deleteEntry,
      customPay, addCustomPay, removeCustomPay,
      createUser, getUsers, deleteUser,
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  )
}
