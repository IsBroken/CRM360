import { useEffect } from 'react'
import Attendance from './pages/Attendance'
import CompanyMaster from './pages/CompanyMaster'
import EmployeeMaster from './pages/EmployeeMaster'
import Login from './pages/Login'
import ManagerAttendance from './pages/ManagerAttendance'
import Visits from './pages/Visits'

function App() {
  useEffect(() => {
    const currentPath = window.location.pathname
    const token = localStorage.getItem('token')

    if (
      (currentPath === '/attendance' || currentPath === '/visits' || currentPath === '/manager' || currentPath === '/manager-attendance' || currentPath === '/company-master' || currentPath === '/employee-master') &&
      !token
    ) {
      window.location.replace('/login')
      return
    }

    if (currentPath === '/login' && token) {
      window.location.replace('/attendance')
    }
  }, [])

  const currentPath = window.location.pathname

  if (currentPath === '/login') {
    return <Login />
  }

  if (currentPath === '/attendance') {
    return <Attendance />
  }

  if (currentPath === '/visits') {
    return <Visits />
}

  if (currentPath === '/manager' || currentPath === '/manager-attendance') {
    return <ManagerAttendance />
  }

  if (currentPath === '/company-master') {
    return <CompanyMaster />
  }

  if (currentPath === '/employee-master') {
    return <EmployeeMaster />
  }

  return <Login />
}

export default App
