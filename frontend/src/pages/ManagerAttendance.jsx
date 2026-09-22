import { useEffect, useMemo, useState } from 'react'
import { getManagerAttendance } from '../services/api'
import { formatAttendanceDateTime } from '../utils/attendanceDate'

function formatDate(dateValue) {
  return formatAttendanceDateTime(dateValue)
}

function getTodayDateString() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function ManagerAttendance() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString())
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      window.location.href = '/login'
      return
    }

    async function fetchRecords() {
      try {
        setLoading(true)
        setError('')
        const data = await getManagerAttendance(selectedDate)
        setRecords(Array.isArray(data?.attendance) ? data.attendance : [])
      } catch (loadError) {
        const message = loadError?.message || 'Unable to load attendance records.'

        if (message.toLowerCase().includes('not found') || message.toLowerCase().includes('404')) {
          setError('Manager attendance endpoint is not available yet. The backend route /api/attendance/all is required.')
        } else {
          setError(message)
        }

        setRecords([])
      } finally {
        setLoading(false)
      }
    }

    fetchRecords()
  }, [selectedDate])

  const totalEmployees = records.length
  const checkedIn = records.filter((row) => row.status === 'checked_in').length
  const checkedOut = records.filter((row) => row.status === 'checked_out').length
  const notCheckedIn = records.filter((row) => row.status === 'not_checked_in').length

  const summaryCards = useMemo(
    () => [
      { label: 'Employees', value: totalEmployees },
      { label: 'Checked in', value: checkedIn },
      { label: 'Checked out', value: checkedOut },
      { label: 'Not checked in', value: notCheckedIn },
    ],
    [checkedIn, checkedOut, notCheckedIn, totalEmployees],
  )

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>CRM360</p>
            <h1 style={styles.title}>Manager Attendance</h1>
          </div>
          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>

        <div style={styles.controlsRow}>
          <label style={styles.fieldLabel} htmlFor="attendance-date">
            Select date
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            style={styles.dateInput}
          />
        </div>

        <div style={styles.summaryGrid}>
          {summaryCards.map((item) => (
            <div key={item.label} style={styles.summaryCard}>
              <span style={styles.summaryLabel}>{item.label}</span>
              <strong style={styles.summaryValue}>{item.value}</strong>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={styles.stateBox}>Loading attendance records...</div>
        ) : error ? (
          <div style={styles.errorBox} role="alert">
            {error}
          </div>
        ) : records.length === 0 ? (
          <div style={styles.stateBox}>No employees found for this date.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Check-in time</th>
                  <th style={styles.th}>Check-out time</th>
                  <th style={styles.th}>Working hours</th>
                  <th style={styles.th}>Check-in address</th>
                  <th style={styles.th}>Check-out address</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id || `${record.employee_name}-${record.date}`}>
                    <td style={styles.td}>{record.employee_name || 'Unknown employee'}</td>
                    <td style={styles.td}>{record.status || '—'}</td>
                    <td style={styles.td}>{formatDate(record.check_in_time)}</td>
                    <td style={styles.td}>{formatDate(record.check_out_time)}</td>
                    <td style={styles.td}>{record.working_hours || '—'}</td>
                    <td style={styles.td}>{record.check_in_address || '—'}</td>
                    <td style={styles.td}>{record.check_out_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #edf4ff 45%, #e2e8f0 100%)',
    fontFamily: 'Segoe UI, sans-serif',
  },
  card: {
    width: '100%',
    maxWidth: '1400px',
    background: '#ffffff',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(15, 23, 42, 0.12)',
    padding: '28px',
    border: '1px solid #e2e8f0',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '24px',
    paddingBottom: '18px',
    borderBottom: '1px solid #e2e8f0',
  },
  eyebrow: {
    margin: '0 0 6px',
    fontSize: '0.7rem',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#64748b',
  },
  title: {
    margin: 0,
    fontSize: 'clamp(2rem, 2vw, 2.6rem)',
    color: '#0f172a',
    letterSpacing: '-0.05em',
  },
  logoutButton: {
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    color: '#334155',
    borderRadius: '12px',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '22px',
    flexWrap: 'wrap',
  },
  fieldLabel: {
    color: '#334155',
    fontWeight: 700,
  },
  dateInput: {
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem',
    background: '#fff',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
    marginBottom: '24px',
  },
  summaryCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    padding: '18px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  summaryLabel: {
    color: '#64748b',
    fontWeight: 600,
    fontSize: '0.9rem',
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: '1.5rem',
    fontWeight: 800,
  },
  stateBox: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#475569',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    fontWeight: 600,
  },
  errorBox: {
    marginBottom: '20px',
    padding: '14px 16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    borderRadius: '12px',
    fontWeight: 600,
  },
  tableWrapper: {
    overflowX: 'auto',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    background: '#ffffff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1100px',
    background: '#ffffff',
  },
  th: {
    padding: '12px 10px',
    textAlign: 'left',
    fontSize: '0.8rem',
    color: '#475569',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    whiteSpace: 'nowrap',
    fontWeight: 700,
  },
  td: {
    padding: '12px 10px',
    fontSize: '0.85rem',
    color: '#0f172a',
    borderBottom: '1px solid #e2e8f0',
    verticalAlign: 'top',
    background: '#fff',
  },
}
