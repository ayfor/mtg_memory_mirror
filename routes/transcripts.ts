import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PrismaClient } from "@prisma/client";
import { transcriptQueue } from "../jobs/queue";

const prisma = new PrismaClient();

interface CreateTranscriptBody {
  content: string;
}

export async function transcriptRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /transcripts - Create a new transcript and queue it for processing
  fastify.post<{ Body: CreateTranscriptBody }>(
    "/transcripts",
    {
      schema: {
        body: {
          type: "object",
          required: ["content"],
          properties: {
            content: { type: "string", minLength: 1 },
          },
        },
        response: {
          201: {
            type: "object",
            properties: {
              id: { type: "string" },
              status: { type: "string" },
              message: { type: "string" },
            },
          },
          400: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Body: CreateTranscriptBody }>, reply: FastifyReply) => {
      const { content } = request.body;

      if (!content || content.trim().length === 0) {
        return reply.status(400).send({ error: "Content is required" });
      }

      try {
        // Create transcript in database
        const transcript = await prisma.transcript.create({
          data: {
            content: content.trim(),
            status: "pending",
          },
        });

        // Queue the transcript for NLP processing
        await transcriptQueue.add(
          "process-transcript",
          {
            transcriptId: transcript.id,
            content: transcript.content,
          },
          {
            jobId: transcript.id,
          }
        );

        fastify.log.info(`Transcript ${transcript.id} created and queued for processing`);

        return reply.status(201).send({
          id: transcript.id,
          status: transcript.status,
          message: "Transcript queued for processing",
        });
      } catch (error) {
        fastify.log.error({ err: error }, "Error creating transcript");
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );

  // GET /transcripts/:id - Get transcript by ID with card counts
  fastify.get<{ Params: { id: string } }>(
    "/transcripts/:id",
    {
      schema: {
        params: {
          type: "object",
          required: ["id"],
          properties: {
            id: { type: "string" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              id: { type: "string" },
              content: { type: "string" },
              status: { type: "string" },
              createdAt: { type: "string" },
              updatedAt: { type: "string" },
              cards: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    cardName: { type: "string" },
                    count: { type: "number" },
                  },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { id } = request.params;

      try {
        const transcript = await prisma.transcript.findUnique({
          where: { id },
          include: {
            cards: {
              select: {
                cardName: true,
                count: true,
              },
            },
          },
        });

        if (!transcript) {
          return reply.status(404).send({ error: "Transcript not found" });
        }

        return reply.send({
          id: transcript.id,
          content: transcript.content,
          status: transcript.status,
          createdAt: transcript.createdAt.toISOString(),
          updatedAt: transcript.updatedAt.toISOString(),
          cards: transcript.cards,
        });
      } catch (error) {
        fastify.log.error({ err: error }, "Error fetching transcript");
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );

  // GET /transcripts - List all transcripts
  fastify.get(
    "/transcripts",
    {
      schema: {
        response: {
          200: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string" },
                status: { type: "string" },
                createdAt: { type: "string" },
                updatedAt: { type: "string" },
              },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const transcripts = await prisma.transcript.findMany({
          select: {
            id: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.send(
          transcripts.map((t) => ({
            id: t.id,
            status: t.status,
            createdAt: t.createdAt.toISOString(),
            updatedAt: t.updatedAt.toISOString(),
          }))
        );
      } catch (error) {
        fastify.log.error({ err: error }, "Error listing transcripts");
        return reply.status(500).send({ error: "Internal server error" });
      }
    }
  );
}
