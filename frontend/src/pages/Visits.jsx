import { useEffect, useState } from 'react'
import { createVisit, getMyVisits } from '../services/api'

export default function Visits() {
  const [form, setForm] = useState({
    client_name: '',
    purpose: '',
    visit_date: new Date().toISOString().split('T')[0],
    visit_time: new Date().toTimeString().slice(0, 5),
    latitude: '',
    longitude: '',
    notes: '',
  })

  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadVisits()
  }, [])

  async function loadVisits() {
    try {
      setFetching(true)
      const data = await getMyVisits()
      setVisits(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'Failed to load visits')
    } finally {
      setFetching(false)
    }
  }

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  function captureLocation() {
    setMessage('')
    setError('')

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((previous) => ({
          ...previous,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }))

        setMessage('Location captured successfully')
      },
      () => {
        setError('Unable to capture your location. Please allow location access.')
      }
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setError('')

    if (!form.latitude || !form.longitude) {
      setError('Please capture your current location first')
      return
    }

    try {
      setLoading(true)

      const visitDateTime = `${form.visit_date}T${form.visit_time}:00`

      await createVisit({
        client_name: form.client_name,
        purpose: form.purpose,
        visit_date: form.visit_date,
        visit_time: visitDateTime,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        notes: form.notes || null,
      })

      setMessage('Visit created successfully')

      setForm((previous) => ({
        ...previous,
        client_name: '',
        purpose: '',
        notes: '',
      }))

      await loadVisits()
    } catch (err) {
      setError(err.message || 'Failed to create visit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Visits</h1>
          <p style={styles.subtitle}>
            Record client visits and view your visit history.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.cardTitle}>Create Visit</h2>

        <form onSubmit={handleSubmit}>
          <div style={styles.grid}>
            <div style={styles.field}>
              <label style={styles.label}>Client Name</label>
              <input
                type="text"
                name="client_name"
                value={form.client_name}
                onChange={handleChange}
                placeholder="Enter client name"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Purpose</label>
              <input
                type="text"
                name="purpose"
                value={form.purpose}
                onChange={handleChange}
                placeholder="Enter visit purpose"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Visit Date</label>
              <input
                type="date"
                name="visit_date"
                value={form.visit_date}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Visit Time</label>
              <input
                type="time"
                name="visit_time"
                value={form.visit_time}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.locationBox}>
            <div>
              <strong>Location</strong>
              <p style={styles.locationText}>
                {form.latitude && form.longitude
                  ? `Latitude: ${form.latitude}, Longitude: ${form.longitude}`
                  : 'Location not captured yet'}
              </p>
            </div>

            <button
              type="button"
              onClick={captureLocation}
              style={styles.secondaryButton}
            >
              Capture Location
            </button>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Notes</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Add visit notes"
              rows="4"
              style={styles.textarea}
            />
          </div>

          {message && <div style={styles.success}>{message}</div>}
          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={styles.primaryButton}
          >
            {loading ? 'Saving Visit...' : 'Create Visit'}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.historyHeader}>
          <h2 style={styles.cardTitle}>My Visit History</h2>

          <button
            type="button"
            onClick={loadVisits}
            style={styles.refreshButton}
          >
            Refresh
          </button>
        </div>

        {fetching ? (
          <p>Loading visits...</p>
        ) : visits.length === 0 ? (
          <p style={styles.empty}>No visits recorded yet.</p>
        ) : (
          <div style={styles.visitList}>
            {visits.map((visit) => (
              <div key={visit.id} style={styles.visitItem}>
                <div style={styles.visitTop}>
                  <h3 style={styles.visitClient}>
                    {visit.client_name}
                  </h3>

                  <span style={styles.status}>
                    {visit.status || 'Completed'}
                  </span>
                </div>

                <p style={styles.visitPurpose}>
                  <strong>Purpose:</strong> {visit.purpose}
                </p>

                <p style={styles.visitDetails}>
                  <strong>Date:</strong> {visit.visit_date}
                </p>

                {visit.address && (
                  <p style={styles.visitDetails}>
                    <strong>Address:</strong> {visit.address}
                  </p>
                )}

                {visit.notes && (
                  <p style={styles.visitDetails}>
                    <strong>Notes:</strong> {visit.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: {
    padding: '24px',
    maxWidth: '1100px',
    margin: '0 auto',
  },

  header: {
    marginBottom: '24px',
  },

  title: {
    margin: 0,
    fontSize: '30px',
    fontWeight: '700',
    color: '#12355b',
  },

  subtitle: {
    marginTop: '8px',
    color: '#64748b',
  },

  card: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  },

  cardTitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#12355b',
    fontSize: '21px',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '18px',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '18px',
  },

  label: {
    fontWeight: '600',
    color: '#334155',
  },

  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
  },

  textarea: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '12px',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '14px',
    resize: 'vertical',
  },

  locationBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    flexWrap: 'wrap',
    padding: '16px',
    marginBottom: '18px',
    background: '#eff6ff',
    borderRadius: '10px',
  },

  locationText: {
    margin: '6px 0 0',
    color: '#475569',
    fontSize: '14px',
  },

  primaryButton: {
    border: 'none',
    borderRadius: '8px',
    padding: '13px 20px',
    background: '#2563eb',
    color: '#ffffff',
    fontWeight: '600',
    cursor: 'pointer',
  },

  secondaryButton: {
    border: 'none',
    borderRadius: '8px',
    padding: '11px 16px',
    background: '#0f766e',
    color: '#ffffff',
    fontWeight: '600',
    cursor: 'pointer',
  },

  refreshButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '9px 14px',
    background: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
  },

  success: {
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '8px',
    background: '#dcfce7',
    color: '#166534',
  },

  error: {
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '8px',
    background: '#fee2e2',
    color: '#991b1b',
  },

  historyHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },

  empty: {
    color: '#64748b',
  },

  visitList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  visitItem: {
    padding: '18px',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    background: '#f8fafc',
  },

  visitTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },

  visitClient: {
    margin: 0,
    color: '#12355b',
    fontSize: '18px',
  },

  status: {
    padding: '5px 10px',
    borderRadius: '20px',
    background: '#dcfce7',
    color: '#166534',
    fontSize: '12px',
    fontWeight: '600',
  },

  visitPurpose: {
    marginBottom: '8px',
    color: '#334155',
  },

  visitDetails: {
    margin: '6px 0',
    color: '#475569',
    fontSize: '14px',
  },
}