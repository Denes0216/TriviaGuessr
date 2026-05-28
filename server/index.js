require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { handleMessage, handleDisconnect } = require('./gameManager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).slice(2, 10);

  ws.on('message', (data) => {
    try {
      handleMessage(ws, JSON.parse(data), wss);
    } catch {
      send(ws, { type: 'ERROR', message: 'Invalid message.' });
    }
  });

  ws.on('close', () => handleDisconnect(ws, wss));
  ws.on('error', () => handleDisconnect(ws, wss));
});

function send(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`TriviaGuessr server on port ${PORT}`));
