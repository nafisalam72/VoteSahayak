import { config } from "./src/server/config.js";
import { createApp } from "./src/server/app.js";

const start = () => {
  const app = createApp();
  app.listen(config.port, "0.0.0.0", () => {
    process.stdout.write(JSON.stringify({
      severity: "INFO",
      message: "Server started",
      port: config.port,
      env: config.nodeEnv,
    }) + "\n");
  });
};

start();
