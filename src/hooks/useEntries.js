import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

export function useEntries() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'entries'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const add = (data) =>
    addDoc(collection(db, 'entries'), { ...data, createdAt: serverTimestamp() })

  const update = (id, data) =>
    updateDoc(doc(db, 'entries', id), { ...data, updatedAt: serverTimestamp() })

  const remove = (id) => deleteDoc(doc(db, 'entries', id))

  return { entries, loading, add, update, remove }
}
