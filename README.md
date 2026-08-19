# Link Play

静态磁力视频站：GitHub Pages 只托管 HTML / JSON，**视频字节不经过你的 VPS**。观看页在浏览器里加载 [WebTorrent](https://webtorrent.io/)，从 swarm 和 web seed 边下边播。

本仓库没有后端、没有 npm 构建、没有种子搜索或下载器。本地预览一条命令即可：

```bash
python3 -m http.server
```

浏览器打开 <http://127.0.0.1:8000/>。不要直接双击 `index.html`，否则 `videos.json` 会因 `file://` 跨源而加载失败。

## 为什么用浏览器 P2P，而不是 3Mbps VPS 推流

一台 3Mbps 的机器大约只能稳定推一路标清。若把 `mp4` 放在 VPS 上当源站，同时在线人数一多就会卡，还可能产生流量费用。

本站的做法：

1. GitHub Pages（或任意静态托管）只下发页面和 `videos.json`，体积很小。
2. 播放页引入 jsDelivr 上的 `webtorrent@2.5.1`，并用仓库根目录的官方 `sw.min.js` 做同域 Service Worker（浏览器不允许从 CDN 注册 SW）。
3. 浏览器加入 torrent swarm：从其他 WebRTC 节点、以及磁力里的 `ws` web seed / `xs` `.torrent` 地址拉数据。
4. 选中种子里第一个可播放文件（`mp4` / `webm` / `mkv`），优先边下边播；Service Worker 不可用时改为下完再播。

因此 **VPS 不必输出视频字节**，也不需要额外的付费 CDN / 对象存储来扛片源。带宽由节点和 web seed 承担。

浏览器只能使用 **WebRTC / WebSocket Tracker**（`wss://`）。纯 UDP Tracker 在网页里不可用。演示条目已带上 WebTorrent.io 的 `wss` Tracker、`ws` web seed 和 `xs` 种子文件地址。

## 如何添加一条磁力

编辑仓库根目录的 [`videos.json`](videos.json)。每条记录：

```json
{
  "id": "my-open-film",
  "title": "片名",
  "description": "一句话介绍",
  "poster": "https://example.com/poster.jpg",
  "magnet": "magnet:?xt=urn:btih:...&dn=...&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2F...&xs=https%3A%2F%2F....torrent"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | URL 别名，只能用字母数字和连字符。播放地址：`watch.html?id=my-open-film` |
| `title` | 是 | 卡片和播放页标题 |
| `description` | 是 | 简介 |
| `poster` | 否 | 海报图 URL |
| `magnet` | 是 | 完整磁力。浏览器播放至少要有 `wss` Tracker；有 `ws` / `xs` 更容易起播 |

保存后重新打开首页即可。也可以不写片单，直接打开：

`watch.html?magnet=<URI 编码后的磁力>`

首页顶部的输入框会生成这个地址。播放页的「复制链接」会复制可分享的 `id` 或 `magnet` 地址。

磁力需要已经有 **WebTorrent 网络里的做种者**，或可用的 HTTP(S) web seed。可用 [WebTorrent Desktop](https://webtorrent.io/desktop) 或 [Instant.io](https://instant.io) 把你有权分发的内容喂给网页节点。

## 部署到 GitHub Pages

1. 把本仓库推到 GitHub。
2. 打开仓库 **Settings → Pages**。
3. Build and deployment 选 **Deploy from a branch**。
4. Branch 选 `main`，目录选 `/ (root)`，保存。
5. 等一两分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

不需要 GitHub Actions，也不需要 `npm install`。站点是纯静态文件。若仓库名不是 Pages 根域名，相对路径（`assets/`、`videos.json`）仍然有效。

## 演示片从哪里来

演示磁力 **只** 使用 [WebTorrent 官方免费种子](https://github.com/webtorrent/webtorrent/blob/master/docs/free-torrents.md) 里的 Blender 开源短片：

- [Sintel](https://durian.blender.org/)（CC BY 3.0）
- [Big Buck Bunny](https://peach.blender.org/)（CC BY 3.0）

它们带有 `wss` Tracker、`ws=https://webtorrent.io/torrents/` 以及对应的 `xs` `.torrent` URL。仓库里 **没有**、也 **不会** 放受版权保护的电影磁力。

## 你必须只使用有权传播的磁力

BitTorrent 本身是传输协议，但分享未授权的影视作品在多数地区违法。本项目只提供播放器页面：

- 不要把盗版电影、剧集、直播录像的磁力写进 `videos.json`。
- 不要用本站做种子搜索、爬虫或聚合。
- 上线前确认：你是著作权人或已获得分发许可，或内容确为公有领域 / 允许分发的开放许可证。
- 观看者也应只打开自己有权获取的链接。

违反上述约定产生的法律风险由使用者自行承担。

## 页面说明

| 文件 | 作用 |
| --- | --- |
| `index.html` | 卡片列表 + 粘贴磁力 |
| `watch.html` | `?id=slug` 或 `?magnet=` 播放；进度、节点、速度；复制分享链接 |
| `videos.json` | 片单 |
| `assets/watch.js` | 引入 jsDelivr 的 `webtorrent@2.5.1`，选第一个可播放视频文件 |
| `sw.min.js` | 官方 WebTorrent 2.5.1 Service Worker（必须同域，CDN 无法注册 SW）。播放页用它做边下边播；失败时改为下完再播 |

播放页是深色、少干扰的布局。统计项包括下载进度、节点数和实时速度。
