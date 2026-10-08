const net = require('net');
const express = require('express');
const path = require('path');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;

let lastGpsData = {
  imei: null,
  lat: null,
  lng: null,
  altitude: null,
  speed: null,
  timestamp: null
};

// Mengizinkan server membaca file statis di folder utama
app.use(express.static(__dirname));

// API untuk Leaflet JS membaca koordinat terbaru
app.get('/api/gps', (req, res) => {
  res.json(lastGpsData);
});

// Menampilkan UI Peta (index.html) saat domain dibuka
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Server running on port ${HTTP_PORT}`);
});
