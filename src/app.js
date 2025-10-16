import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import authRoutes from "./routes/auth.routes.js";
import devicesRoutes from "./routes/devices.routes.js";
import readingsRoutes from "./routes/readings.routes.js";
import alertsRoutes from "./routes/alerts.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import communityRoutes from "./routes/community.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Helmet global (protege toda la API)
app.use(helmet());

// 🚩 Swagger: relajar CSP/COOP/COEP SOLO en /api/docs (para que cargue en HTTP)
const swaggerHelmet = helmet({
  contentSecurityPolicy: {
    useDefaults: true,
    directives: {
      "script-src": ["'self'", "'unsafe-inline'", "https:", "http:"],
      "style-src":  ["'self'", "'unsafe-inline'", "https:", "http:"],
      "img-src":    ["'self'", "data:", "https:", "http:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false
});

// (Opcional) CORS permisivo solo para docs
app.use("/api/docs", swaggerHelmet, (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

// UI + JSON del spec (útil para debug)
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// Rutas de negocio (sin cambios)
app.use("/api/auth", authRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/readings", readingsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/community", communityRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

// Manejador de errores
app.use(errorHandler);

export default app;
