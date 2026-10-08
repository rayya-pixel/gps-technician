const net = require('net');
const express = require('express');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const TCP_PORT = process.env.TCP_PORT || 5207;

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

// Halaman web dashboard sederhana
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
          <div class="item"><span class="label">IMEI:</span> ${lastGpsData.imei || 'Menunggu koneksi alat...'}</div>
          <div class="item"><span class="label">Latitude:</span> ${lastGpsData.lat !== null ? lastGpsData.lat : '-'}</div>
          <div class="item"><span class="label">Longitude:</span> ${lastGpsData.lng !== null ? lastGpsData.lng : '-'}</div>
          <div class="item"><span class="label">Kecepatan:</span> ${lastGpsData.speed !== null ? lastGpsData.speed + ' km/h' : '-'}</div>
          <div class="item"><span class="label">Ketinggian:</span> ${lastGpsData.altitude !== null ? lastGpsData.altitude + ' m' : '-'}</div>
          <div class="item"><span class="label">Waktu Update:</span> ${lastGpsData.timestamp || '-'}</div>
        </div>
      </body>
    </html>
  `);
});

app.listen(HTTP_PORT, () => {
  console.log(`[HTTP] Server running on port ${HTTP_PORT}`);
});

// Server TCP untuk menerima data dari Teltonika FMB130
const tcpServer = net.createServer((socket) => {
  let imei = null;

  socket.on('data', (data) => {
    // 1. Handshake IMEI Teltonika
    if (!imei) {
      if (data.length >= 2) {
        const imeiLength = data.readUInt16BE(0);
        if (data.length >= 2 + imeiLength) {
          imei = data.toString('ascii', 2, 2 + imeiLength);
          console.log(`[TCP] Connected IMEI: ${imei}`);
          // Kirim respon ACCEPT (0x01) ke Teltonika
          socket.write(Buffer.from([0x01]));
          return;
        }
      }
    }

    // 2. Parsing Data Kodek Teltonika (Codec 8 / Codec 8 Extended)
    try {
      if (data.length > 10) {
        const numberOfData = data.readUInt8(9); // Jumlah record data
        
        // Contoh parsing sederhana mengambil timestamp & data lokasi dari buffer
        lastGpsData = {
          imei: imei,
          lat: (data.readInt32BE(19) / 10000000), // Latitude
          lng: (data.readInt32BE(15) / 10000000), // Longitude
          altitude: data.readInt16BE(23),         // Altitude
          speed: data.readUInt16BE(27),           // Speed
          timestamp: new Date().toISOString()
        };

        console.log(`[GPS UPDATE] IMEI: ${imei} | Lat: ${lastGpsData.lat}, Lng: ${lastGpsData.lng}`);

        // Kirim respon Acknowledgment (ACK) berisi jumlah record yang diterima
        const ack = Buffer.alloc(4);
        ack.writeUInt32BE(numberOfData, 0);
        socket.write(ack);
      }
    } catch (err) {
      console.error('[TCP PARSE ERROR]', err.message);
    }
  });

  socket.on('error', (err) => console.error('[TCP SOCKET ERROR]', err.message));
  socket.on('close', () => console.log('[TCP] Client disconnected'));
});

tcpServer.listen(TCP_PORT, () => {
  console.log(`[TCP] Server listening on port ${TCP_PORT}`);
});
