const net = require('net');
const express = require('express');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const TCP_PORT = process.env.TCP_PORT || 5207;

// Data GPS Terakhir
let lastGpsData = {
  imei: null,
  lat: null,
  lng: null,
  speed: null,
  timestamp: null
};

app.use(express.static(__dirname));

// API untuk membaca data GPS
app.get('/api/gps', (req, res) => {
  res.json(lastGpsData);
});

// Tampilan Peta Langsung
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>GPS Tracker</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
        body, html { height: 100%; width: 100%; }
        #map { height: 100vh; width: 100vw; }
        .card {
          position: absolute; top: 15px; left: 15px; z-index: 1000;
          background: white; padding: 15px 20px; border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.15); min-width: 240px;
        }
        .card h3 { font-size: 16px; margin-bottom: 10px; color: #333; display: flex; align-items: center; justify-content: space-between; }
        .status { font-size: 11px; padding: 3px 8px; border-radius: 12px; background: #dc3545; color: white; }
        .status.online { background: #28a745; }
        .info { font-size: 13px; color: #555; margin-bottom: 5px; }
        .info strong { color: #111; }
      </style>
    </head>
    <body>
      <div class="card">
        <h3>🚗 GPS Mobil <span id="status" class="status">Offline</span></h3>
        <div class="info">IMEI: <strong id="imei">-</strong></div>
        <div class="info">Kecepatan: <strong id="speed">-</strong></div>
        <div class="info">Update: <strong id="time">-</strong></div>
      </div>
      <div id="map"></div>
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <script>
        const map = L.map('map').setView([-6.200000, 106.816666], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        let marker;
        async function getGPS() {
          try {
            const res = await fetch('/api/gps');
            const data = await res.json();
            if (data && data.lat !== null && data.lng !== null) {
              const lat = parseFloat(data.lat);
              const lng = parseFloat(data.lng);
              document.getElementById('imei').innerText = data.imei || '-';
              document.getElementById('speed').innerText = (data.speed || 0) + ' km/h';
              document.getElementById('time').innerText = new Date(data.timestamp).toLocaleTimeString();
              const status = document.getElementById('status');
              status.innerText = 'Online';
              status.classList.add('online');
              if (!marker) {
                marker = L.marker([lat, lng]).addTo(map);
                map.setView([lat, lng], 15);
              } else {
                marker.setLatLng([lat, lng]);
              }
            }
          } catch (e) { console.error(e); }
        }
        setInterval(getGPS, 3000);
        getGPS();
      </script>
    </body>
    </html>
  `);
});

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Server running on port ${HTTP_PORT}`);
});
