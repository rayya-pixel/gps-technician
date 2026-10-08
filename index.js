const net = require('net');
const express = require('express');
const TeltonikaParser = require('teltonika-parser-ex');

const app = express();
const HTTP_PORT = process.env.PORT || 3000;
const TCP_PORT = process.env.TCP_PORT || 5027;

let lastGpsData = {
  imei: null,
  lat: null,
  lng: null,
  altitude: null,
  speed: null,
  timestamp: null
};

app.use(express.static('.'));

app.get('/api/gps', (req, res) => {
  res.json(lastGpsData);
});

app.listen(HTTP_PORT, () => console.log(`[HTTP] Running on port ${HTTP_PORT}`));

const tcpServer = net.createServer((socket) => {
  let imei = null;

  socket.on('data', (rawBuffer) => {
    if (!imei) {
      const imeiLength = rawBuffer.readUInt16BE(0);
      imei = rawBuffer.toString('ascii', 2, 2 + imeiLength);
      console.log(`[TCP] Connected IMEI: ${imei}`);
      socket.write(Buffer.from([0x01]));
      return;
    }

    try {
      const parsedData = new TeltonikaParser(rawBuffer);
      if (parsedData && parsedData.records && parsedData.records.length > 0) {
        const latestRecord = parsedData.records[parsedData.records.length - 1];
        if (latestRecord.gps) {
          lastGpsData = {
            imei: imei,
            lat: latestRecord.gps.latitude,
            lng: latestRecord.gps.longitude,
            altitude: latestRecord.gps.altitude,
            speed: latestRecord.gps.speed,
            timestamp: new Date(latestRecord.timestamp).toISOString()
          };
          console.log(`[GPS UPDATE] Lat: ${lastGpsData.lat}, Lng: ${lastGpsData.lng}`);
        }
        const ackBuffer = Buffer.alloc(4);
        ackBuffer.writeUInt32BE(parsedData.records.length, 0);
        socket.write(ackBuffer);
      }
    } catch (err) {
      console.error('[TCP ERROR]', err.message);
    }
  });
});

tcpServer.listen(TCP_PORT, () => console.log(`[TCP] Listening on port ${TCP_PORT}`));
