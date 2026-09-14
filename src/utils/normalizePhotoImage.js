// Re-encodes any selected image file/blob to a JPEG before it's uploaded.
// This is deliberately format-agnostic rather than special-cased for any one
// source format: it guarantees the server always gets bytes with a
// trustworthy Content-Type, and that every viewer's browser can render the
// result, regardless of what format/MIME type the original file claimed to
// be.
//
// The primary path is a plain canvas decode/re-encode, which covers every
// format browsers natively render (JPEG, PNG, WEBP, GIF, ...). HEIC/HEIF —
// iPhone's default photo format — is the one common case no browser can
// decode natively (not even Safari, despite iOS itself supporting it), so
// that path falls back to a dedicated WASM decoder for it specifically.
export async function normalizePhotoImage(file) {
  try {
    return await normalizeViaCanvas(file)
  } catch {
    return await normalizeViaHeicDecoder(file)
  }
}

async function normalizeViaCanvas(file) {
  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Could not decode image'))
      img.src = objectUrl
    })

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    canvas.getContext('2d').drawImage(image, 0, 0)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
    if (!blob) throw new Error('Could not encode image')

    return blob
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

async function normalizeViaHeicDecoder(file) {
  // Loaded lazily: most uploads never need it, and it bundles a sizeable
  // WASM HEIF decoder. Uses libheif-js directly (rather than a wrapper like
  // heic2any) because it tracks upstream libheif releases — needed to
  // decode HEIC files with newer feature boxes such as the HDR gain-map
  // ("tmap") track iOS 17+ adds to photos by default; older bundled
  // decoders fail to parse those with a generic "Could not parse HEIF file".
  const { default: libheif } = await import('libheif-js/wasm-bundle')
  const buffer = await file.arrayBuffer()

  const decoder = new libheif.HeifDecoder()
  const images = decoder.decode(buffer)
  if (!images.length) throw new Error('Could not decode HEIC image')

  const image = images[0]
  const width = image.get_width()
  const height = image.get_height()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const imageData = ctx.createImageData(width, height)

  await new Promise((resolve, reject) => {
    image.display(imageData, (displayData) => {
      if (!displayData) reject(new Error('Could not render HEIC image'))
      else resolve()
    })
  })

  ctx.putImageData(imageData, 0, 0)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92))
  if (!blob) throw new Error('Could not encode image')

  return blob
}
