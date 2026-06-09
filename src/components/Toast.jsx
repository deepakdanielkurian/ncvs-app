import { useApp } from '../contexts/AppContext'
import { C } from '../utils/helpers'

export default function Toast() {
  const { toast } = useApp()
  return (
    <div style={{
      position: 'fixed', bottom: 88, left: '50%',
      transform: `translateX(-50%) translateY(${toast.show ? 0 : 20}px)`,
      background: C.dk, color: '#fff',
      padding: '10px 18px', borderRadius: 20,
      fontSize: 13, fontWeight: 500,
      opacity: toast.show ? 1 : 0,
      transition: 'all .3s',
      pointerEvents: 'none',
      whiteSpace: 'nowrap', zIndex: 500,
      maxWidth: '90vw', textAlign: 'center',
    }}>
      {toast.msg}
    </div>
  )
}
