import { createApp } from "./app.js";
import { PORT } from "./config.js";

const app = await createApp();
const server = app.listen(PORT, () => {
  console.log(`CliniAgenda API disponível em http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => app.locals.close());
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
