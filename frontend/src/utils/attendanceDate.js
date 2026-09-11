const IST_TIME_ZONE = 'Asia/Kolkata'

function parseDateValue(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const hasExplicitTimeZone = /(Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)

    if (!hasExplicitTimeZone && /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(trimmed)) {
      return new Date(`${trimmed.replace(' ', 'T')}Z`)
    }

    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export function formatAttendanceDateTime(value) {
  if (!value) return '—'

  const parsed = parseDateValue(value)
  if (!parsed) {
    return String(value)
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: IST_TIME_ZONE,
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}
