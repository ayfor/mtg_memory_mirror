import { Worker, Job } from "bullmq";
import { PrismaClient } from "@prisma/client";
import IORedis from "ioredis";
import { TranscriptJobData } from "../queue";
import { extractCardNames } from "../../services/cardExtractor";

const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

const connection = new IORedis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

async function processTranscript(job: Job<TranscriptJobData>): Promise<void> {
  const { transcriptId, content } = job.data;

  console.log(`Processing transcript ${transcriptId}`);

  try {
    // Update transcript status to processing
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { status: "processing" },
    });

    // Extract card names from the transcript content
    const cardResults = extractCardNames(content);

    console.log(`Found ${cardResults.length} unique cards in transcript ${transcriptId}`);

    // Save card counts to database
    if (cardResults.length > 0) {
      await prisma.cardCount.createMany({
        data: cardResults.map((result) => ({
          cardName: result.cardName,
          count: result.count,
          transcriptId,
        })),
      });
    }

    // Update transcript status to completed
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { status: "completed" },
    });

    console.log(`Transcript ${transcriptId} processed successfully`);
  } catch (error) {
    console.error(`Error processing transcript ${transcriptId}:`, error);

    // Update transcript status to failed
    await prisma.transcript.update({
      where: { id: transcriptId },
      data: { status: "failed" },
    });

    throw error;
  }
}

const worker = new Worker<TranscriptJobData>(
  "transcript-processing",
  processTranscript,
  {
    connection,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed for transcript ${job.data.transcriptId}`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("Worker error:", err);
});

console.log("Transcript worker started and listening for jobs...");

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down worker...");
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
});
