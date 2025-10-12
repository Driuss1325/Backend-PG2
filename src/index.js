import 'dotenv/config'; // <-- AÑADE ESTO
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { initSocket } from './services/socket.service.js';
import { registerMonitorNamespace } from './sockets/monitor.socket.js';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  await connectDB();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  initSocket(io);
  registerMonitorNamespace(io);
  server.listen(PORT, () => console.log(`API ready on :${PORT}`));
}

bootstrap().catch(err => { console.error('Failed to start:', err); process.exit(1); });
