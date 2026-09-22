import { useEffect, useState } from 'react'
import { getCurrentUser } from './services/api'
import Sidebar from './components/Sidebar'
import Attendance from './pages/Attendance'
import CompanyMaster from './pages/CompanyMaster'
import EmployeeMaster from './pages/EmployeeMaster'
import Login from './pages/Login'
import ManagerAttendance from './pages/ManagerAttendance'
import Visits from './pages/Visits'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const token = localStorage.getItem('token')
  const currentPath = window.location.pathname

useEffect(() => {
  if (
    (currentPath === '/attendance' ||
      currentPath === '/visits' ||
      currentPath === '/manager' ||
      currentPath === '/manager-attendance' ||
      currentPath === '/company-master' ||
      currentPath === '/employee-master') &&
    !token
  ) {
    window.location.replace('/login')
    return
  }

  if (currentPath === '/login' && token) {
    window.location.replace('/attendance')
    return
  }

  if (token) {
    getCurrentUser()
      .then((user) => {
        setCurrentUser(user)

        const isManagerRoute =
          currentPath === '/manager' ||
          currentPath === '/manager-attendance'

        const isAdminRoute =
          currentPath === '/company-master' ||
          currentPath === '/employee-master'

        const isManagerOrAdmin =
          user.role === 'manager' || user.role === 'admin'

        if (isManagerRoute && !isManagerOrAdmin) {
          window.location.replace('/attendance')
          return
        }

        if (isAdminRoute && user.role !== 'admin') {
          window.location.replace('/attendance')
          return
        }
      })
      .catch(() => {
        localStorage.removeItem('token')
        window.location.replace('/login')
      })
  }
}, [])

  if (currentPath === '/login') {
  return <Login />
}

let page = null

if (currentPath === '/attendance') {
  page = <Attendance />
}

if (currentPath === '/visits') {
  page = <Visits />
}

if (currentPath === '/manager' || currentPath === '/manager-attendance') {
  page = <ManagerAttendance />
}

if (currentPath === '/company-master') {
  page = <CompanyMaster />
}

if (currentPath === '/employee-master') {
  page = <EmployeeMaster />
}

if (page) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar role={currentUser?.role} />

      <main style={{ flex: 1, minWidth: 0 }}>
        {page}
      </main>
    </div>
  )
}

return <Login />
}

export default App
