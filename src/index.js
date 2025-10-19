import 'dotenv/config';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app.js';
import { connectDB, sequelize } from './config/db.js';
import { initSocket } from './services/socket.service.js';
import { registerMonitorNamespace } from './sockets/monitor.socket.js';
import { spawn } from 'child_process';

const PORT = Number(process.env.PORT || 3001);
const RUN_MIGRATIONS_ON_BOOT = String(process.env.DB_MIGRATE_ON_BOOT || 'false').toLowerCase() === 'true';

async function runMigrations() {
  if (!RUN_MIGRATIONS_ON_BOOT) return;
  await new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const p = spawn(cmd, ['sequelize-cli', 'db:migrate'], { stdio: 'inherit' });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(`db:migrate exited with ${code}`)));
  });
}

async function bootstrap() {
  // 1) DB: conecta y verifica
  await connectDB();            // tu función que configura sequelize con TLS Aiven
  await sequelize.authenticate();
  console.log('[DB] Conectado a MySQL (Aiven)');

  // ⚠️ NO usar alter en prod
  // if (process.env.NODE_ENV !== 'production') {
  //   await sequelize.sync({ alter: true });
  // }

  // (opcional) Ejecutar migraciones al boot si habilitas la var de entorno
  await runMigrations();

  // 2) HTTP + Socket.IO
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: { origin: process.env.CORS_ORIGIN || '*' }
  });
  initSocket(io);
  registerMonitorNamespace(io);

  server.listen(PORT, () => console.log(`API ready on :${PORT}`));

  // 3) Apagado limpio
  const shutdown = (signal) => async () => {
    try {
      console.log(`[${signal}] Recibida. Cerrando…`);
      io.close();
      server.close(() => console.log('HTTP cerrado'));
      await sequelize.close();
      console.log('DB cerrada');
      process.exit(0);
    } catch (e) {
      console.error('Error en shutdown:', e?.message);
      process.exit(1);
    }
  };
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));
}

bootstrap().catch(err => {
  console.error('Failed to start:', err);
  process.exit(1);
});
