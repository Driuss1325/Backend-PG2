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
app.use(helmet());

app.use("/api/auth", authRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/readings", readingsRoutes);
app.use("/api/alerts", alertsRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/community", communityRoutes);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/health", (_, res) => res.json({ ok: true }));
app.use(errorHandler);

export default app;
