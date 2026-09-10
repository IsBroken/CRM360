import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { checkInApi, checkOutApi, getAttendanceMe } from '../services/api'

function formatDateTime(value) {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function Attendance() {
  const [attendanceData, setAttendanceData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      window.location.href = '/login'
      return
    }

    async function loadAttendance() {
      try {
        setLoading(true)
        setError('')

        const data = await getAttendanceMe()
        setAttendanceData(data)
      } catch (loadError) {
        setError(loadError.message || 'Unable to load attendance details.')
      } finally {
        setLoading(false)
      }
    }

    loadAttendance()
  }, [])

  async function requestLocationAndSubmit() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.')
      return
    }

    setActionLoading(true)
    setError('')

    const getPosition = () =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })
          },
          (geoError) => {
            let message = 'Unable to get your location.'

            if (geoError.code === 1) {
              message = 'Location permission denied. Please allow location access to continue.'
            } else if (geoError.code === 2) {
              message = 'Location is currently unavailable.'
            } else if (geoError.code === 3) {
              message = 'Location request timed out. Please try again.'
            }

            reject(new Error(message))
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        )
      })

    try {
      const coordinates = await getPosition()
      const todayRecord = attendanceData?.attendance?.find((record) => {
        const today = getLocalDateString()
        return record.date === today
      })

      if (todayRecord?.status === 'checked_in') {
        await checkOutApi(coordinates)
      } else {
        await checkInApi(coordinates)
      }

      const refreshed = await getAttendanceMe()
      setAttendanceData(refreshed)
    } catch (submitError) {
      setError(submitError.message || 'Unable to submit attendance.')
    } finally {
      setActionLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  function handleOpenManagerAttendance() {
    window.location.href = '/manager-attendance'
  }

  const todayRecord = attendanceData?.attendance?.find((record) => {
    const today = getLocalDateString()
    return record.date === today
  })

  const hasCheckedIn = todayRecord?.status === 'checked_in'
  const hasCheckedOut = todayRecord?.status === 'checked_out'
  const actionLabel = hasCheckedIn ? 'Check Out' : 'Check In'
  const currentStatus = !todayRecord
    ? 'Not checked in'
    : hasCheckedOut
      ? 'Checked out'
      : 'Checked in'

  const historyRecords = [...(attendanceData?.attendance || [])].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()

    if (dateA === dateB) {
      return new Date(b.check_in_time || 0).getTime() - new Date(a.check_in_time || 0).getTime()
    }

    return dateB - dateA
  })

  const statusTheme =
    currentStatus === 'Checked in'
      ? {
          background: '#ecfdf5',
          color: '#166534',
          border: '1px solid #a7f3d0',
        }
      : currentStatus === 'Checked out'
        ? {
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #bfdbfe',
          }
        : {
            background: '#fef2f2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
          }

  const checkInCoords = todayRecord?.check_in_lat != null && todayRecord?.check_in_lng != null
    ? [todayRecord.check_in_lat, todayRecord.check_in_lng]
    : null

  const checkOutCoords = todayRecord?.check_out_lat != null && todayRecord?.check_out_lng != null
    ? [todayRecord.check_out_lat, todayRecord.check_out_lng]
    : null

  const latestCoords = checkOutCoords || checkInCoords

  useEffect(() => {
    if (!mapRef.current) {
      return undefined
    }

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current, {
        scrollWheelZoom: false,
      }).setView([0, 0], 2)

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current)
    }

    if (latestCoords) {
      requestAnimationFrame(() => {
        mapInstanceRef.current?.invalidateSize()
      })
    }

    return undefined
  }, [latestCoords])

  useEffect(() => {
    const map = mapInstanceRef.current

    if (!map) {
      return
    }

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    if (!latestCoords) {
      map.setView([0, 0], 2)
      requestAnimationFrame(() => map.invalidateSize())
      return
    }

    const markers = []

    if (checkInCoords) {
      const checkInMarker = L.circleMarker(checkInCoords, {
        radius: 9,
        color: '#2563eb',
        fillColor: '#2563eb',
        fillOpacity: 0.9,
      }).addTo(map)
      markers.push(checkInMarker)
    }

    if (checkOutCoords) {
      const checkOutMarker = L.circleMarker(checkOutCoords, {
        radius: 9,
        color: '#16a34a',
        fillColor: '#16a34a',
        fillOpacity: 0.9,
      }).addTo(map)
      markers.push(checkOutMarker)
    }

    markersRef.current = markers
    requestAnimationFrame(() => map.invalidateSize())

    if (checkInCoords && checkOutCoords) {
      const bounds = L.latLngBounds([checkInCoords, checkOutCoords])
      map.fitBounds(bounds, { padding: [30, 30] })
      return
    }

    map.setView(latestCoords, 16)
  }, [checkInCoords, checkOutCoords, latestCoords])

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Attendance</h1>
          <p style={styles.loadingText}>Loading attendance...</p>
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <h1 style={styles.title}>Attendance</h1>
          <div style={styles.errorBox} role="alert">
            {error}
          </div>
          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </section>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>CRM360</p>
            <h1 style={styles.title}>Attendance</h1>
          </div>
          <button type="button" onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>

        <div style={styles.summaryGrid}>
          <div style={styles.statusBox}>
            <span style={styles.label}>Employee</span>
            <strong style={styles.value}>{attendanceData?.employee_name || 'Employee'}</strong>
          </div>

          <div style={{ ...styles.statusBox, ...statusTheme }}>
            <span style={styles.label}>Status</span>
            <strong style={styles.value}>{currentStatus}</strong>
          </div>
        </div>

        <div style={styles.actionRow}>
          <button type="button" onClick={handleOpenManagerAttendance} style={styles.secondaryButton}>
            Manager Attendance
          </button>
        </div>

        {!todayRecord ? (
          <div style={styles.emptyState}>Not checked in</div>
        ) : (
          <div style={styles.detailGroup}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Check-in time</span>
              <strong>{formatDateTime(todayRecord.check_in_time)}</strong>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Check-in address</span>
              <strong>{todayRecord.check_in_address || 'Address not available'}</strong>
            </div>

            {todayRecord.check_out_time ? (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Check-out time</span>
                <strong>{formatDateTime(todayRecord.check_out_time)}</strong>
              </div>
            ) : null}

            {todayRecord.check_out_address ? (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Check-out address</span>
                <strong>{todayRecord.check_out_address || 'Address not available'}</strong>
              </div>
            ) : null}

            {todayRecord.working_hours ? (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Working hours</span>
                <strong>{todayRecord.working_hours}</strong>
              </div>
            ) : null}
          </div>
        )}

        {latestCoords ? (
          <div style={styles.mapSection}>
            <div style={styles.mapHeader}>Attendance location</div>
            <div ref={mapRef} style={styles.map} />
          </div>
        ) : (
          <div style={styles.emptyState}>No attendance coordinates available yet.</div>
        )}

        <div style={styles.historySection}>
          <h2 style={styles.historyTitle}>Attendance History</h2>

          {historyRecords.length === 0 ? (
            <div style={styles.emptyState}>No attendance history yet.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Check-in time</th>
                    <th style={styles.th}>Check-in address</th>
                    <th style={styles.th}>Check-out time</th>
                    <th style={styles.th}>Check-out address</th>
                    <th style={styles.th}>Working hours</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRecords.map((record) => (
                    <tr key={record.id || `${record.date}-${record.check_in_time}`}>
                      <td style={styles.td}>{new Date(record.date).toLocaleDateString()}</td>
                      <td style={styles.td}>{formatDateTime(record.check_in_time)}</td>
                      <td style={styles.td}>{record.check_in_address || 'Address not available'}</td>
                      <td style={styles.td}>{formatDateTime(record.check_out_time)}</td>
                      <td style={styles.td}>{record.check_out_address || 'Address not available'}</td>
                      <td style={styles.td}>{record.working_hours || '—'}</td>
                      <td style={styles.td}>{record.status || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={requestLocationAndSubmit}
          disabled={actionLoading}
          style={{
            ...styles.primaryButton,
            opacity: actionLoading ? 0.75 : 1,
            cursor: actionLoading ? 'wait' : 'pointer',
          }}
        >
          {actionLoading ? 'Getting location...' : actionLabel}
        </button>
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
    maxWidth: '1180px',
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
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '22px',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '20px',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: '10px',
    padding: '10px 14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  statusBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 18px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '14px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.5)',
  },
  label: {
    color: '#64748b',
    fontSize: '0.92rem',
    fontWeight: 600,
  },
  value: {
    color: '#0f172a',
    fontSize: '1rem',
    fontWeight: 700,
  },
  emptyState: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    color: '#475569',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '20px',
    fontWeight: 600,
  },
  mapSection: {
    marginBottom: '20px',
    display: 'grid',
    gap: '10px',
    padding: '18px',
    background: '#f8fafc',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
  },
  mapHeader: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#334155',
    letterSpacing: '0.02em',
  },
  map: {
    width: '100%',
    height: '280px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1',
  },
  historySection: {
    marginBottom: '20px',
    display: 'grid',
    gap: '12px',
  },
  historyTitle: {
    margin: 0,
    fontSize: '1.15rem',
    color: '#0f172a',
    fontWeight: 700,
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
    minWidth: '980px',
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
  detailGroup: {
    display: 'grid',
    gap: '12px',
    marginBottom: '20px',
  },
  detailRow: {
    display: 'grid',
    gap: '6px',
    padding: '14px 16px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  detailLabel: {
    color: '#64748b',
    fontSize: '0.9rem',
    fontWeight: 600,
  },
  primaryButton: {
    width: '100%',
    border: 'none',
    background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)',
    color: '#fff',
    borderRadius: '14px',
    padding: '18px 20px',
    fontSize: '1.08rem',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 12px 20px rgba(37, 99, 235, 0.25)',
  },
  loadingText: {
    margin: 0,
    color: '#475569',
    fontSize: '1rem',
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
}
