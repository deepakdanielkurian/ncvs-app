import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login        from './pages/Login'
import Home         from './pages/Home'
import Members      from './pages/Members'
import Entries      from './pages/Entries'
import Attendance   from './pages/Attendance'
import Report       from './pages/Report'
import Admin        from './pages/Admin'
import Layout       from './components/Layout'
import Toast        from './components/Toast'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <>
      <Toast />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index              element={<Home />} />
          <Route path="members"    element={<Members />} />
          <Route path="entries"    element={<Entries />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="report"     element={<Report />} />
          <Route path="admin"      element={<Admin />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
