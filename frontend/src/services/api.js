export const API_BASE_URL = 'https://crm360-ogo1.onrender.com'
function getAuthToken() {
  return localStorage.getItem('token')
}

async function request({
  endpoint,
  method = 'GET',
  body = null,
  auth = false,
}) {
  const headers = {
    'Content-Type': 'application/json',
  }

  if (auth) {
    const token = getAuthToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && payload.detail
        ? payload.detail
        : 'Request failed'

    throw new Error(message)
  }

  return payload
}

export function loginApi(email, password) {
  return request({
    endpoint: '/api/auth/login',
    method: 'POST',
    body: { email, password },
  })
}

export function getAttendanceMe() {
  return request({
    endpoint: '/api/attendance/me',
    method: 'GET',
    auth: true,
  })
}

export function getManagerAttendance(date) {
  return request({
    endpoint: `/api/attendance/all?date=${encodeURIComponent(date)}`,
    method: 'GET',
    auth: true,
  })
}

export function checkInApi({ lat, lng }) {
  return request({
    endpoint: '/api/attendance/check-in',
    method: 'POST',
    body: { lat, lng },
    auth: true,
  })
}

export function checkOutApi({ lat, lng }) {
  return request({
    endpoint: '/api/attendance/check-out',
    method: 'POST',
    body: { lat, lng },
    auth: true,
  })
}

export function getCompanies() {
  return request({
    endpoint: '/api/companies',
    method: 'GET',
    auth: true,
  })
}

export function createCompany(data) {
  return request({
    endpoint: '/api/companies',
    method: 'POST',
    body: data,
    auth: true,
  })
}

export function updateCompany(id, data) {
  return request({
    endpoint: `/api/companies/${id}`,
    method: 'PUT',
    body: data,
    auth: true,
  })
}

export function updateCompanyStatus(id, is_active) {
  return request({
    endpoint: `/api/companies/${id}/status`,
    method: 'PATCH',
    body: { is_active },
    auth: true,
  })
}

export function getEmployees() {
  return request({
    endpoint: '/api/employees',
    method: 'GET',
    auth: true,
  })
}

export function createEmployee(data) {
  return request({
    endpoint: '/api/employees',
    method: 'POST',
    body: data,
    auth: true,
  })
}

export function updateEmployee(id, data) {
  return request({
    endpoint: `/api/employees/${id}`,
    method: 'PUT',
    body: data,
    auth: true,
  })
}

export function updateEmployeeStatus(id, is_active) {
  return request({
    endpoint: `/api/employees/${id}/status`,
    method: 'PATCH',
    body: { is_active },
    auth: true,
  })
}

export function createVisit(data) {
  return request({
    endpoint: '/api/visits',
    method: 'POST',
    body: data,
    auth: true,
  })
}

export function getMyVisits() {
  return request({
    endpoint: '/api/visits/me',
    method: 'GET',
    auth: true,
  })
}
