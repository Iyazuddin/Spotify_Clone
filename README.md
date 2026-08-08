# Spotify Clone — Web Player

A Spotify-style web player that streams **real music**. Every song plays its official audio via the YouTube IFrame API, and the library lives in a simple JSON file — no database required. The app is **static-first**: it runs on any static host (Netlify, Vercel, GitHub Pages) with zero setup, and an optional Express backend provides a REST API when you run it locally.

Built as a portfolio project to demonstrate fullstack skills: an Express REST API, a vanilla-JS single-page UI, and modern responsive design.

---

## ✨ Features

- **Real audio streaming** — every track plays its official song via the keyless YouTube IFrame Player API (no placeholder tunes, no API key needed)
- **Playback controls** — play/pause, previous/next, seekable progress bar
- **Shuffle & repeat** — shuffle, repeat-all, and repeat-one (with a visible "1" badge)
- **Volume** — slider plus a mute/unmute toggle
- **Live search** — instant filtering by title / artist / album (runs client-side, so it works on any host)
- **Liked Songs** — heart any track; favorites persist in `localStorage` across reloads
- **Lyrics panel** — full synced lyrics for **every track** in Romanized English, time-aligned to the audio and auto-scrolling
- **Keyboard shortcuts** — `Space` play/pause · `←`/`→` prev/next · `L` toggle lyrics
- **Fully responsive** — desktop layout, a slide-in mobile drawer for the sidebar, and touch-friendly controls

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 4 |
| Frontend | Vanilla JavaScript (ES2020+), HTML5, CSS3 |
| Data store | JSON file (`data/songs.json`) — no database needed |
| Audio | YouTube IFrame Player API (keyless) |
| Icons | Font Awesome 6.7.2 |
| Fonts | Google Fonts (Montserrat, Teko, Varela Round) |

---

## 📁 Project Structure

```
Spotify_Clone/
├── assets/                # UI icons (logo, nav, player controls)
│   ├── logo.png
│   ├── library_icon.png
│   ├── backward_icon.png / forward_icon.png
│   └── player_icon2.png / player_icon4.png
├── data/
│   └── songs.json         # The "database": all songs + section definitions
├── index.html             # App shell (layout, player bar, lyrics panel)
├── script.js              # Player logic + search / liked / shuffle / repeat
├── style.css              # Spotify-style dark theme + responsive rules
├── server.js              # Express API + static file server
├── package.json           # Dependencies + start script
├── package-lock.json      # Locked dependency tree
└── .gitignore
```

### API endpoints

| Route | Behavior |
|---|---|
| `GET /api/songs` | All songs; `?search=q` filters case-insensitively by title / artist / album |
| `GET /api/songs/:id` | Single song (JSON `404` if missing) |
| `GET /api/sections` | Section definitions: `[{ id, title, songIds }]` |
| `GET /api/health` | `{ "status": "ok" }` |

> These endpoints are served by the Express server when you run `npm start`. The static deploy reads `data/songs.json` directly instead — no server required.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or newer) and npm

### Run locally

```bash
# 1. Clone the repo
git clone https://github.com/Iyazuddin/Spotify_Clone.git
cd Spotify_Clone

# 2. Install dependencies
npm install

# 3. Start the server
npm start

# 4. Open in your browser
http://localhost:4000
```

> **Note:** the app must be served over HTTP — opening `index.html` as a `file://` won't work. It's **static-first**, so any static host works; running `npm start` additionally gives you the Express REST API on top.

### Adding or changing songs

Edit `data/songs.json` — each song needs an `id`, `title`, `artist`, `album`, a public/embeddable YouTube `videoId`, a CSS `gradient` cover, and an optional timed `lyrics` array. Then refresh (static) or restart the server (`npm start`).

---

## 🌐 Deployment

The app is **static-first** — the frontend reads `data/songs.json` directly and runs search client-side, so it needs no server at runtime. It deploys as-is to any static host:

- **Netlify** — connect the GitHub repo (or drag-drop the folder). No build command; publish directory = project root.
- **Vercel / GitHub Pages / Cloudflare Pages** — same thing, just serve the static files.

No environment variables, no API keys, no build step. The Express backend is optional — run `npm start` locally if you also want the REST API.

---

## 🔮 Future Improvements

- Add literal English translations alongside the Romanized lyrics
- Playlist creation + persistence
- Swap the JSON store for MongoDB/MySQL
- User accounts & cloud-synced liked songs
- Animated equalizer/visualizer on the player

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

## 👤 Author

**Iyazuddin**

- GitHub: [@Iyazuddin](https://github.com/Iyazuddin)

*Built as a fullstack portfolio project — Node.js/Express + vanilla JavaScript.*
