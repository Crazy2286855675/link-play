export const VIDEO_EXT = /\.(mp4|webm|mkv)$/i

const WSS_TRACKERS = [
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.webtorrent.dev'
]

export async function loadVideos () {
  const res = await fetch('videos.json', { cache: 'no-cache' })
  if (!res.ok) {
    throw new Error('无法加载 videos.json，请用本地静态服务器打开本站。')
  }
  return res.json()
}

export function pickPlayableFile (torrent) {
  return torrent.files.find((file) => VIDEO_EXT.test(file.name))
}

export function withBrowserTrackers (magnet) {
  let uri = String(magnet || '').trim()
  for (const tracker of WSS_TRACKERS) {
    const encoded = encodeURIComponent(tracker)
    if (!uri.includes(tracker) && !uri.includes(encoded)) {
      uri += (uri.includes('?') ? '&' : '?') + 'tr=' + encoded
    }
  }
  return uri
}

export function magnetDisplayName (magnet) {
  try {
    const dn = new URL(magnet).searchParams.get('dn')
    return dn ? decodeURIComponent(dn.replace(/\+/g, ' ')) : '磁力链接'
  } catch {
    return '磁力链接'
  }
}

export function findByMagnet (videos, magnet) {
  const hash = infoHash(magnet)
  if (!hash) return null
  return videos.find((item) => infoHash(item.magnet) === hash) || null
}

export function infoHash (magnet) {
  const match = String(magnet).match(/xt=urn:btih:([a-zA-Z0-9]+)/i)
  return match ? match[1].toLowerCase() : ''
}

export function formatBytes (bytes) {
  const value = Number(bytes) || 0
  if (value < 1024) return value + ' B'
  if (value < 1024 * 1024) return (value / 1024).toFixed(1) + ' KB'
  if (value < 1024 * 1024 * 1024) return (value / (1024 * 1024)).toFixed(2) + ' MB'
  return (value / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

export function formatSpeed (bytesPerSec) {
  return formatBytes(bytesPerSec) + '/s'
}

export function shareUrl (id, magnet) {
  const url = new URL('watch.html', location.href)
  url.search = ''
  if (id) {
    url.searchParams.set('id', id)
  } else if (magnet) {
    url.searchParams.set('magnet', magnet)
  }
  return url.href
}

export function showToast (message) {
  let toast = document.querySelector('.toast')
  if (!toast) {
    toast = document.createElement('div')
    toast.className = 'toast'
    document.body.appendChild(toast)
  }
  toast.textContent = message
  toast.classList.add('show')
  clearTimeout(showToast._timer)
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 1800)
}
