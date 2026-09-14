// Re-encodes any selected image file/blob to a JPEG via canvas before it's
// uploaded. This is deliberately format-agnostic rather than special-cased
// for any one source format: it guarantees the server always gets bytes with
// a trustworthy Content-Type, and that every viewer's browser can render the
// result, regardless of what format/MIME type the original file claimed to
// be (this is what fixes iPhone HEIC photos, whose file.type is often empty
// in Mobile Safari — Safari can still decode HEIC into <img>/canvas, so the
// re-encode step below succeeds and produces a real image/jpeg blob).
export async function normalizePhotoImage(file) {
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
