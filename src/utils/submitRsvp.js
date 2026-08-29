const RSVP_ENDPOINT = (
  import.meta.env.VITE_RSVP_ENDPOINT
  || import.meta.env.VITE_ENQUIRY_ENDPOINT
  || ''
).trim()

export async function submitRsvp(form, templateName, metadata = {}) {
  const payload = new FormData(form)

  if (templateName) payload.set('template', String(templateName))

  Object.entries(metadata).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      payload.set(key, String(value))
    }
  })

  if (!RSVP_ENDPOINT) return { demo: true }

  const response = await fetch(RSVP_ENDPOINT, {
    method: 'POST',
    body: payload,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) throw new Error('RSVP could not be sent')

  return { demo: false }
}
