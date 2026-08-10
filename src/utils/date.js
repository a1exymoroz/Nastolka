// Converts between the local wall-clock strings native `date`/`datetime-local`
// inputs use and the UTC ISO-8601 instants the API sends/expects (see
// https://github.com/a1exymoroz/Nastolka-api/issues/16). `Date`'s multi-arg
// constructor and getters always operate in the browser's local timezone,
// which is what lets these round-trip correctly for any user offset.

function pad(n) {
  return String(n).padStart(2, '0')
}

export function toDateInputValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function toDateTimeInputValue(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return `${toDateInputValue(isoString)}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// `new Date('YYYY-MM-DD').toISOString()` would parse the string as UTC
// midnight per spec, silently discarding the user's local offset — so this
// builds the Date from local components instead, via the multi-arg
// constructor, before converting to a UTC instant.
export function dateInputValueToIso(dateString) {
  if (!dateString) return null
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day).toISOString()
}

export function dateTimeInputValueToIso(dateTimeString) {
  if (!dateTimeString) return null
  return new Date(dateTimeString).toISOString()
}
