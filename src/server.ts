import Fastify from "fastify";
import { transcriptRoutes } from "../routes/transcripts";

const PORT = parseInt(process.env.PORT || "3000", 10);
const HOST = process.env.HOST || "0.0.0.0";

const server = Fastify({
  logger: true,
});

// Register routes
server.register(transcriptRoutes);

// Health check endpoint
server.get("/health", async () => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Start server
const start = async (): Promise<void> => {
  try {
    await server.listen({ port: PORT, host: HOST });
    console.log(`Server is running on http://${HOST}:${PORT}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down server...");
  await server.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  await server.close();
  process.exit(0);
});
