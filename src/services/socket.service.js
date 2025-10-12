let ioInstance = null;
export function initSocket(io) {
  ioInstance = io;
}
export function emitReading(reading) {
  ioInstance?.emit("reading:new", reading);
}
export function emitAlert(alert) {
  ioInstance?.emit("alert:new", alert);
}
