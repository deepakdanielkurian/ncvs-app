import { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc, serverTimestamp
} from 'firebase/firestore'

export function useMembers() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'members'), orderBy('name', 'asc'))
    const unsub = onSnapshot(q, snap => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
    return unsub
  }, [])

  const add    = (data) => addDoc(collection(db, 'members'), { ...data, createdAt: serverTimestamp() })
  const update = (id, data) => updateDoc(doc(db, 'members', id), data)
  const remove = (id) => deleteDoc(doc(db, 'members', id))

  return { members, loading, add, update, remove }
}
