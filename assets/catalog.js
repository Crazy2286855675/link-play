function cardHtml(video) {
  const poster = video.poster
    ? '<img src="' + escapeAttr(video.poster) + '" alt="" loading="lazy">'
    : '<div class="poster-fallback">No still</div>';
  return (
    '<article class="card"><a class="hit" href="watch.html?id=' +
    encodeURIComponent(video.id) +
    '"><div class="poster">' + poster + '</div><div class="card-meta"><h2>' +
    escapeHtml(video.title) +
    '</h2><p>' +
    escapeHtml(video.description || "") +
    "</p></div></a></article>"
  );
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

async function renderCatalog() {
  const grid = document.querySelector("#catalog");
  if (!grid) return;
  try {
    const res = await fetch("videos.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("bad status");
    const videos = await res.json();
    grid.innerHTML = videos.map(cardHtml).join("");
  } catch (error) {
    grid.innerHTML = '<p class="status error">片单读不到。请用本地静态服务打开。</p>';
  }
}

function bindMagnetForm() {
  const form = document.querySelector("#magnet-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const magnet = String(new FormData(form).get("magnet") || "").trim();
    if (magnet.indexOf("magnet:") !== 0) return;
    location.href = "watch.html?magnet=" + encodeURIComponent(magnet);
  });
}

renderCatalog();
bindMagnetForm();
