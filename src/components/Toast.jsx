import { useState, useEffect, useCallback } from 'react'

let showToastFn = null
export const showToast = (msg) => showToastFn && showToastFn(msg)

export default function Toast() {
  const [msg, setMsg]     = useState('')
  const [visible, setVis] = useState(false)

  showToastFn = useCallback((m) => {
    setMsg(m); setVis(true)
    setTimeout(() => setVis(false), 2600)
  }, [])

  return (
    <div className={`toast${visible ? ' show' : ''}`}>{msg}</div>
  )
}
