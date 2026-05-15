import express, { type Express } from "express";
  import cors from "cors";
  import session from "express-session";
  import ConnectPgSimple from "connect-pg-simple";
  import pinoHttp from "pino-http";
  import path from "path";
  import { fileURLToPath } from "url";
  import { pool } from "@workspace/db";
  import router from "./routes";
  import { logger } from "./lib/logger";

  const PgSession = ConnectPgSimple(session);

  const app: Express = express();

  app.set("trust proxy", 1);

  app.use(
    pinoHttp({
      logger,
      serializers: {
        req(req) {
          return {
            id: req.id,
            method: req.method,
            url: req.url?.split("?")[0],
          };
        },
        res(res) {
          return {
            statusCode: res.statusCode,
          };
        },
      },
    }),
  );

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: process.env.SESSION_SECRET ?? "dev-secret-change-in-prod",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    }),
  );

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));

  app.use("/api", router);

  // Serve frontend static files in production
  if (process.env.NODE_ENV === "production") {
    const frontendPath = path.join(__dirname, "public");
    app.use(express.static(frontendPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  }

  export default app;
  