import WebTorrent from 'https://cdn.jsdelivr.net/npm/webtorrent@2.5.1/dist/webtorrent.min.js'
import {
  findByMagnet,
  formatBytes,
  formatSpeed,
  loadVideos,
  magnetDisplayName,
  pickPlayableFile,
  shareUrl,
  showToast,
  withBrowserTrackers
} from './common.js'

const params = new URLSearchParams(location.search)
const requestedId = params.get('id')
const requestedMagnet = params.get('magnet')

const els = {
  title: document.querySelector('#title'),
  description: document.querySelector('#description'),
  status: document.querySelector('#status'),
  progress: document.querySelector('#progress-bar'),
  percent: document.querySelector('#percent'),
  peers: document.querySelector('#peers'),
  speed: document.querySelector('#speed'),
  downloaded: document.querySelector('#downloaded'),
  copy: document.querySelector('#copy-link'),
  video: document.querySelector('#player')
}

let shareHref = location.href
let client

function setStatus (text, kind) {
  els.status.textContent = text
  els.status.className = 'status' + (kind ? ' ' + kind : '')
}

function renderMeta (title, description) {
  els.title.textContent = title
  document.title = title + ' · Link Play'
  els.description.textContent = description || ''
}

async function resolveSource () {
  const videos = await loadVideos().catch(() => [])

  if (requestedMagnet) {
    const match = findByMagnet(videos, requestedMagnet)
    return {
      id: match ? match.id : null,
      title: match ? match.title : magnetDisplayName(requestedMagnet),
      description: match ? match.description : '通过磁力链接直接播放。视频字节来自 swarm / web seed，不经过本站服务器。',
      magnet: requestedMagnet
    }
  }

  if (requestedId) {
    const match = videos.find((item) => item.id === requestedId)
    if (!match) {
      throw new Error('片单里没有这个 id：' + requestedId)
    }
    return match
  }

  throw new Error('缺少播放参数。请从首页点卡片，或打开 watch.html?id=sintel / watch.html?magnet=...')
}

function bindShare () {
  els.copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(shareHref)
      showToast('链接已复制')
    } catch {
      prompt('复制此链接', shareHref)
    }
  })
}

function updateStats (torrent) {
  const percent = Math.round((torrent.progress || 0) * 100)
  els.progress.style.width = percent + '%'
  els.percent.textContent = percent + '%'
  els.peers.textContent = (torrent.numPeers || 0) + ' 节点'
  els.speed.textContent = formatSpeed(torrent.downloadSpeed || 0)
  els.downloaded.textContent = formatBytes(torrent.downloaded) + ' / ' + formatBytes(torrent.length)
}

async function startPlayback (source) {
  renderMeta(source.title, source.description)
  shareHref = shareUrl(source.id, source.magnet)
  setStatus('正在连接 WebTorrent…')

  client = new WebTorrent()
  client.on('error', (error) => {
    setStatus('播放失败：' + error.message, 'error')
  })

  const magnet = withBrowserTrackers(source.magnet)
  const torrent = client.add(magnet, { announce: [
    'wss://tracker.openwebtorrent.com',
    'wss://tracker.btorrent.xyz',
    'wss://tracker.webtorrent.dev'
  ] })

  torrent.on('infoHash', () => {
    setStatus('正在获取元数据（Tracker / web seed）…')
  })

  torrent.on('metadata', () => {
    const file = pickPlayableFile(torrent)
    if (!file) {
      setStatus('这个种子里没有可播放的 mp4 / webm / mkv 文件。', 'error')
      return
    }

    file.select()
    const isMkv = /\.mkv$/i.test(file.name)
    setStatus('已选中 ' + file.name + '，开始边下边播…')

    const done = (error) => {
      if (error) {
        setStatus('无法挂载播放器：' + error.message, 'error')
        return
      }
      if (isMkv) {
        setStatus('正在播放 ' + file.name + '。MKV 在部分浏览器里可能无法解码，可换 Chrome / 使用 mp4。')
      }
    }

    if (typeof file.renderTo === 'function') {
      file.renderTo(els.video, { autoplay: true, controls: true }, done)
    } else if (typeof file.streamTo === 'function') {
      file.streamTo(els.video, done)
    } else {
      setStatus('当前 WebTorrent 版本没有 renderTo / streamTo。', 'error')
    }
  })

  torrent.on('ready', () => {
    if (els.video.paused) {
      els.video.play().catch(() => {})
    }
  })

  torrent.on('download', () => {
    updateStats(torrent)
    if (torrent.progress < 1) {
      setStatus('边下边播中（流量来自节点和 web seed，不走本站带宽）')
    }
  })

  torrent.on('done', () => {
    updateStats(torrent)
    setStatus('已下载完成，正在做种给其他节点。', 'ok')
  })

  torrent.on('error', (error) => {
    setStatus('种子出错：' + error.message, 'error')
  })

  setInterval(() => {
    if (torrent) updateStats(torrent)
  }, 500)
}

window.addEventListener('beforeunload', () => {
  if (client) client.destroy()
})

bindShare()

resolveSource()
  .then(startPlayback)
  .catch((error) => {
    renderMeta('无法播放', '')
    setStatus(error.message, 'error')
  })
