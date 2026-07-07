// Image Optimization Utilities

export const compressImage = async (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height && width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        } else if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height)
          height = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
    }
  })
}

// Lazy Loading Images
export const observeImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.dataset.src
          img.classList.add('loaded')
          imageObserver.unobserve(img)
        }
      })
    })

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img)
    })
  }
}

// Performance Metrics
export const logMetrics = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
      }
    })
    observer.observe({ entryTypes: ['measure'] })
  }
}
