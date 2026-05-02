import { config } from "./src/server/config.js";
import { createApp } from "./src/server/app.js";

// Prevent process from crashing on unhandled library errors
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Only exit in production to ensure high availability on Cloud Run
  if (process.env.NODE_ENV === "production") {
    setTimeout(() => process.exit(1), 1000);
  }
});

const start = () => {
  try {
    const app = createApp();
    app.listen(config.port, "0.0.0.0", () => {
      console.log(`\x1b[32m[Server]\x1b[0m VoteSahayak API is running on port ${config.port}`);
      console.log(`\x1b[34m[Config]\x1b[0m Environment: ${config.nodeEnv}`);
    });
  } catch (err) {
    console.error("Critical Boot Error:", err);
    process.exit(1);
  }
};

start();
