export function registerMonitorNamespace(io) {
  const nsp = io.of("/monitor");
  nsp.on("connection", (socket) => {
    socket.emit("hello", "Bienvenido a FireGuard Monitor");
  });
  return nsp;
}
