function cardHtml (video) {
  const poster = video.poster
    ? `<img src="${escapeAttr(video.poster)}" alt="${escapeAttr(video.title)} 海报" loading="lazy">`
    : `<div class="poster-fallback">暂无海报</div>`

  return `
    <article class="card">
      <a class="poster" href="watch.html?id=${encodeURIComponent(video.id)}">${poster}</a>
      <div class="card-body">
        <h2>${escapeHtml(video.title)}</h2>
        <p>${escapeHtml(video.description || '')}</p>
        <a class="btn" href="watch.html?id=${encodeURIComponent(video.id)}">播放</a>
      </div>
    </article>
  `
}

function escapeHtml (value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr (value) {
  return escapeHtml(value)
}

async function renderCatalog () {
  const grid = document.querySelector('#catalog')
  if (!grid) return

  try {
    const res = await fetch('videos.json', { cache: 'no-cache' })
    if (!res.ok) throw new Error('bad status')
    const videos = await res.json()
    grid.innerHTML = videos.map(cardHtml).join('')
    grid.querySelectorAll('img').forEach((img) => {
      img.addEventListener('error', () => {
        img.replaceWith(Object.assign(document.createElement('div'), {
          className: 'poster-fallback',
          textContent: '海报加载失败'
        }))
      })
    })
  } catch (error) {
    grid.innerHTML = '<p class="status error">片单加载失败。请用 <code>python3 -m http.server</code> 打开本目录，不要直接双击 HTML。</p>'
  }
}

function bindMagnetForm () {
  const form = document.querySelector('#magnet-form')
  if (!form) return

  form.addEventListener('submit', (event) => {
    event.preventDefault()
    const magnet = String(new FormData(form).get('magnet') || '').trim()
    if (!magnet.startsWith('magnet:')) {
      alert('请粘贴以 magnet: 开头的链接。请只播放你有权传播的内容。')
      return
    }
    location.href = 'watch.html?magnet=' + encodeURIComponent(magnet)
  })
}

renderCatalog()
bindMagnetForm()
