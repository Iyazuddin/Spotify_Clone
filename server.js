const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;

const DATA_PATH = path.join(__dirname, "data", "songs.json");
const db = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

app.use(express.static(__dirname));

app.get("/api/songs", (req, res) => {
  const { search } = req.query;
  let songs = db.songs;

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    songs = songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.album.toLowerCase().includes(q),
    );
  }

  res.json(songs);
});

app.get("/api/songs/:id", (req, res) => {
  const id = Number(req.params.id);
  const song = db.songs.find((s) => s.id === id);

  if (!song) {
    return res.status(404).json({ error: "Song not found" });
  }
  res.json(song);
});

app.get("/api/sections", (req, res) => {
  res.json(db.sections);
});
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    songs: db.songs.length,
    sections: db.sections.length,
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`Spotify Clone running at http://localhost:${PORT}`);
});
