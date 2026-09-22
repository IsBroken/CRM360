import { useEffect, useState } from 'react'
import {
  createEmployee,
  getCompanies,
  getEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from '../services/api'

const emptyForm = {
  name: '',
  email: '',
  password: '',
  company_id: '',
  role: 'employee',
  is_active: true,
}

export default function EmployeeMaster() {
  const [employees, setEmployees] = useState([])
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      window.location.href = '/login'
      return
    }

    fetchData()
  }, [])

  async function fetchData() {
    try {
      setLoading(true)
      setError('')
      const [employeesData, companiesData] = await Promise.all([getEmployees(), getCompanies()])
      setEmployees(Array.isArray(employeesData) ? employeesData : [])
      setCompanies(Array.isArray(companiesData) ? companiesData : [])
    } catch (loadError) {
      const message = loadError?.message || 'Unable to load employee data.'
      setError(message)
      setEmployees([])
      setCompanies([])
    } finally {
      setLoading(false)
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function handleLogout() {
    localStorage.removeItem('token')
    window.location.href = '/login'
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        company_id: Number(form.company_id),
        role: form.role,
        is_active: Boolean(form.is_active),
      }

      if (!payload.name || !payload.email || !payload.company_id) {
        throw new Error('Name, email, and company are required.')
      }

      if (editingId === null) {
        if (!form.password.trim()) {
          throw new Error('Password is required.')
        }

        await createEmployee({
          ...payload,
          password: form.password,
        })
        setSuccess('Employee created successfully.')
      } else {
        await updateEmployee(editingId, payload)
        setSuccess('Employee updated successfully.')
      }

      setForm(emptyForm)
      setEditingId(null)
      await fetchData()
    } catch (submitError) {
      setError(submitError?.message || 'Unable to save employee.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(employee) {
    setEditingId(employee.id)
    setError('')
    setSuccess('')
    setForm({
      name: employee.name,
      email: employee.email,
      password: '',
      company_id: String(employee.company_id ?? ''),
      role: employee.role || 'employee',
      is_active: Boolean(employee.is_active),
    })
  }

  function handleCancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
    setSuccess('')
  }

  async function handleStatusToggle(employee) {
    setError('')
    setSuccess('')

    try {
      await updateEmployeeStatus(employee.id, !employee.is_active)
      setSuccess(`Employee ${employee.name} is now ${!employee.is_active ? 'active' : 'inactive'}.`)
      await fetchData()
    } catch (statusError) {
      setError(statusError?.message || 'Unable to update employee status.')
    }
  }

  const getCompanyName = (companyId) => {
    const company = companies.find((item) => item.id === companyId)
    return company ? company.name : 'Unassigned'
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.headerRow}>
          <div>
            <p style={styles.eyebrow}>CRM360</p>
            <h1 style={styles.title}>Employee Master</h1>
          </div>

          <div style={styles.headerActions}>
            <button type="button" onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.formCard}>
          <div style={styles.formHeaderRow}>
            <h2 style={styles.sectionTitle}>{editingId !== null ? 'Edit Employee' : 'Create Employee'}</h2>
            {editingId !== null && (
              <button type="button" onClick={handleCancelEdit} style={styles.cancelButton}>
                Cancel Edit
              </button>
            )}
          </div>

          <div style={styles.formGrid}>
            <label style={styles.fieldWrap}>
              <span style={styles.label}>Name</span>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                style={styles.input}
                placeholder="Employee name"
              />
            </label>

            <label style={styles.fieldWrap}>
              <span style={styles.label}>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="employee@example.com"
              />
            </label>

            {!editingId && (
              <label style={styles.fieldWrap}>
                <span style={styles.label}>Password</span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Password"
                />
              </label>
            )}

            <label style={styles.fieldWrap}>
              <span style={styles.label}>Company</span>
              <select
                name="company_id"
                value={form.company_id}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="">Select a company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </label>

            <label style={styles.fieldWrap}>
              <span style={styles.label}>Role</span>
              <select name="role" value={form.role} onChange={handleChange} style={styles.input}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <label style={styles.checkboxWrap}>
              <input
                type="checkbox"
                name="is_active"
                checked={Boolean(form.is_active)}
                onChange={handleChange}
                style={styles.checkbox}
              />
              <span style={styles.label}>Active</span>
            </label>
          </div>

          <div style={styles.formActions}>
            <button type="submit" disabled={saving} style={styles.primaryButton}>
              {saving ? 'Saving...' : editingId !== null ? 'Update Employee' : 'Create Employee'}
            </button>
          </div>
        </form>

        {error ? (
          <div style={styles.errorBox} role="alert">
            {error}
          </div>
        ) : null}

        {success ? <div style={styles.successBox}>{success}</div> : null}

        {loading ? (
          <div style={styles.stateBox}>Loading employees...</div>
        ) : employees.length === 0 ? (
          <div style={styles.stateBox}>No employees found.</div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Company</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td style={styles.td}>{employee.name}</td>
                    <td style={styles.td}>{employee.email}</td>
                    <td style={styles.td}>{getCompanyName(employee.company_id)}</td>
                    <td style={styles.td}>{employee.role}</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          background: employee.is_active ? '#dcfce7' : '#fef2f2',
                          color: employee.is_active ? '#166534' : '#991b1b',
                        }}
                      >
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionGroup}>
                        <button type="button" onClick={() => handleEdit(employee)} style={styles.actionButton}>
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusToggle(employee)}
                          style={{
                            ...styles.actionButton,
                            background: employee.is_active ? '#fef2f2' : '#dcfce7',
                            color: employee.is_active ? '#991b1b' : '#166534',
                          }}
                        >
                          {employee.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
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
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
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
  formCard: {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '22px',
  },
  formHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: 0,
    color: '#0f172a',
    fontSize: '1.25rem',
  },
  cancelButton: {
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#475569',
    borderRadius: '10px',
    padding: '8px 12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    alignItems: 'end',
  },
  fieldWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    color: '#334155',
    fontWeight: 600,
  },
  checkboxWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    minHeight: '52px',
    color: '#334155',
    fontWeight: 600,
  },
  label: {
    fontSize: '0.9rem',
    fontWeight: 700,
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    fontSize: '0.95rem',
    color: '#0f172a',
    boxSizing: 'border-box',
  },
  checkbox: {
    width: '18px',
    height: '18px',
  },
  formActions: {
    marginTop: '18px',
    display: 'flex',
    justifyContent: 'flex-start',
  },
  primaryButton: {
    border: 'none',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    borderRadius: '10px',
    padding: '11px 18px',
    fontWeight: 700,
    cursor: 'pointer',
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
  successBox: {
    marginBottom: '20px',
    padding: '14px 16px',
    background: '#ecfdf5',
    border: '1px solid #a7f3d0',
    color: '#166534',
    borderRadius: '12px',
    fontWeight: 600,
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
  actionGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionButton: {
    border: '1px solid #cbd5e1',
    background: '#eff6ff',
    color: '#1d4ed8',
    borderRadius: '8px',
    padding: '7px 10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    padding: '6px 10px',
    fontSize: '0.72rem',
    fontWeight: 800,
    letterSpacing: '0.03em',
  },
}
