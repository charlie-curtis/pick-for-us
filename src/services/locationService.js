const workerUrl = import.meta.env.VITE_WORKER_URL

export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by your browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location access denied — try entering an address instead'))
    )
  })
}

export async function searchNearbyPlaces(lat, lng, radius) {
  if (!workerUrl) throw new Error('Search unavailable.')
  const radiusMeters = radius * 1609.34
  const res = await fetch(`${workerUrl}/nearby`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      includedTypes: ['restaurant'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        }
      }
    })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(res.status === 429 ? 'Daily search limit reached — try again tomorrow.' : 'Search failed — try again.')
  const names = (data.places ?? [])
    .filter(p => p.displayName?.text)
    .map(p => p.displayName.text)
  return [...new Set(names)]
}

export async function geocodeAddress(address) {
  if (!workerUrl) throw new Error('Search unavailable.')
  const res = await fetch(`${workerUrl}/geocode?address=${encodeURIComponent(address)}`)
  const data = await res.json()
  if (data.status !== 'OK') throw new Error('Address not found — try a more specific address or zip code.')
  const { lat, lng } = data.results[0].geometry.location
  return { lat, lng }
}
