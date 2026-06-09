import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { db } from '../firebase'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
  getDocs, where, serverTimestamp, setDoc, getDoc
} from 'firebase/firestore'
import { todayStr } from '../utils/helpers'

const AppContext = createContext()
export const useApp = () => useContext(AppContext)

const SESSION_KEY = 'ncvs_session'

export function AppProvider({ children }) {
  // ── Auth state (custom — stored in Firestore users collection) ──
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { return null }
  })
  const [authLoading, setAuthLoading] = useState(false)

  // ── Data state ──
  const [entries,   setEntries]   = useState([])
  const [members,   setMembers]   = useState([])
  const [customPay, setCustomPay] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ncvs_custom_pay') || '[]') } catch { return [] }
  })
  const [dataLoading, setDataLoading] = useState(true)
  const [toast, setToast]   = useState({ msg: '', show: false })
  const [toastTimer, setToastTimer] = useState(null)

  // ── Toast ──
  const showToast = useCallback((msg) => {
    if (toastTimer) clearTimeout(toastTimer)
    setToast({ msg, show: true })
    const t = setTimeout(() => setToast(p => ({ ...p, show: false })), 2600)
    setToastTimer(t)
  }, [toastTimer])

  // ── Custom pay methods ──
  const saveCustomPay = (list) => {
    setCustomPay(list)
    localStorage.setItem('ncvs_custom_pay', JSON.stringify(list))
  }
  const addCustomPay = (method) => {
    if (!method.trim() || customPay.includes(method.trim())) return false
    saveCustomPay([...customPay, method.trim()])
    return true
  }
  const removeCustomPay = (method) => saveCustomPay(customPay.filter(m => m !== method))

  // ── Custom Auth: login checks Firestore users collection ──
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
      // Remove password from stored session
      const session = { id: u.id, username: u.username, name: u.name, role: u.role }
      setUser(session)
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      setAuthLoading(false)
      return { ok: true }
    } catch (e) {
      setAuthLoading(false)
      return { ok: false, error: 'Connection error. Check internet.' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }

  // ── Real-time listeners (only when logged in) ──
  useEffect(() => {
    if (!user) { setDataLoading(false); return }
    setDataLoading(true)

    const unsubEntries = onSnapshot(
      query(collection(db, 'entries'), orderBy('createdAt', 'desc')),
      snap => {
        setEntries(snap.docs.map(d => ({ ...d.data(), id: d.id })))
        setDataLoading(false)
      },
      () => setDataLoading(false)
    )

    const unsubMembers = onSnapshot(
      query(collection(db, 'members'), orderBy('name', 'asc')),
      snap => setMembers(snap.docs.map(d => ({ ...d.data(), id: d.id })))
    )

    return () => { unsubEntries(); unsubMembers() }
  }, [user])

  // ── Entries CRUD ──
  const addEntry = async (data) => {
    await addDoc(collection(db, 'entries'), {
      ...data,
      createdAt: serverTimestamp(),
      createdBy: user?.username || ''
    })
  }

  const updateEntry = async (id, data) => {
    await updateDoc(doc(db, 'entries', id), {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: user?.username || ''
    })
  }

  const deleteEntry = async (id) => {
    await deleteDoc(doc(db, 'entries', id))
  }

  // ── Members CRUD ──
  const addMember    = (data) => addDoc(collection(db, 'members'), { ...data, createdAt: serverTimestamp() })
  const updateMember = (id, data) => updateDoc(doc(db, 'members', id), data)
  const deleteMember = (id) => deleteDoc(doc(db, 'members', id))

  // ── Attendance ──
  const saveAttendance = async (date, records) => {
    const present = Object.values(records).filter(v => v === 'present').length
    const absent  = Object.values(records).filter(v => v === 'absent').length
    await setDoc(doc(db, 'attendance', date), {
      date, records, presentCount: present, absentCount: absent,
      savedAt: serverTimestamp(), savedBy: user?.username || ''
    })
  }

  const getAttendance = async (date) => {
    const snap = await getDoc(doc(db, 'attendance', date))
    return snap.exists() ? snap.data() : null
  }

  const getAttendanceHistory = async () => {
    const snap = await getDocs(query(collection(db, 'attendance'), orderBy('date', 'desc')))
    return snap.docs.map(d => ({ ...d.data(), id: d.id })).slice(0, 60)
  }

  // ── Admin: create user ──
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
    return snap.docs.map(d => ({ id: d.id, ...d.data(), password: '••••••' }))
  }

  const deleteUser = async (id) => deleteDoc(doc(db, 'users', id))

  return (
    <AppContext.Provider value={{
      // auth
      user, authLoading, login, logout,
      // data
      entries, members, dataLoading,
      // entries
      addEntry, updateEntry, deleteEntry,
      // members
      addMember, updateMember, deleteMember,
      // attendance
      saveAttendance, getAttendance, getAttendanceHistory,
      // admin
      createUser, getUsers, deleteUser,
      // custom pay
      customPay, addCustomPay, removeCustomPay,
      // toast
      toast, showToast,
    }}>
      {children}
    </AppContext.Provider>
  )
}
