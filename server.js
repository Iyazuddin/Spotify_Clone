/* ============================================
   Spotify Clone — Express API Server
   Serves the static frontend + a JSON-backed REST API
   Run: npm start  →  http://localhost:4000
   ============================================ */
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

const DATA_PATH = path.join(__dirname, "data", "songs.json");
const db = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

/* ---------- Static frontend ---------- */
app.use(express.static(__dirname));

/* ---------- API ---------- */

// GET /api/songs?search=q  →  all songs, optionally filtered by title/artist/album
app.get("/api/songs", (req, res) => {
  const { search } = req.query;
  let songs = db.songs;

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    songs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q)
    );
  }

  res.json(songs);
});

// GET /api/songs/:id  →  single song (404 if missing)
app.get("/api/songs/:id", (req, res) => {
  const id = Number(req.params.id);
  const song = db.songs.find((s) => s.id === id);

  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }
  res.json(song);
});

// GET /api/sections  →  section definitions (ordered song ids per section)
app.get("/api/sections", (req, res) => {
  res.json(db.sections);
});

// GET /api/health  →  server status
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", songs: db.songs.length, sections: db.sections.length });
});

// JSON 404 for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Spotify Clone running at http://localhost:${PORT}`);
});
