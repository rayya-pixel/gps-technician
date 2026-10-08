const net = require('net');
const express = require('express');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;

// Menyimpan data GPS terakhir
let lastGpsData = {
  imei: null,
  lat: null,
  lng: null,
  altitude: null,
  speed: null,
  timestamp: null
};

app.use(express.static('.'));

// API Endpoint untuk membaca data GPS
app.get('/api/gps', (req, res) => {
  res.json(lastGpsData);
});

// Halaman web dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>GPS Server Teltonika</title>
        <meta http-equiv="refresh" content="5">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f4f6f8; color: #333; }
          .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 500px; }
          h2 { color: #2c3e50; margin-top: 0; }
          .item { margin-bottom: 10px; font-size: 16px; }
          .label { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>GPS SERVER TELTONIKA ✅</h2>
          <div class="item"><span class="label">Status Server:</span> Running</div>
          <div class="item"><span class="label">IMEI:</span> ${lastGpsData.imei || 'Menunggu koneksi alat...'}</div>
          <div class="item"><span class="label">Latitude:</span> ${lastGpsData.lat !== null ? lastGpsData.lat : '-'}</div>
          <div class="item"><span class="label">Longitude:</span> ${lastGpsData.lng !== null ? lastGpsData.lng : '-'}</div>
          <div class="item"><span class="label">Kecepatan:</span> ${lastGpsData.speed !== null ? lastGpsData.speed + ' km/h' : '-'}</div>
          <div class="item"><span class="label">Waktu Update:</span> ${lastGpsData.timestamp || '-'}</div>
        </div>
      </body>
    </html>
  `);
});

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Server running on port ${HTTP_PORT}`);
});
