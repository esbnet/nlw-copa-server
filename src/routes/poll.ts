import { FastifyInstance } from "fastify"
import ShortUniqueId from "short-unique-id"
import { z } from "zod"

import { prisma } from "../lib/prisma"
import { authenticate } from "../plugin/authenticate"

export async function poolRoutes(fastify: FastifyInstance) {
  fastify.get("/polls/count", async () => {
    const count = await prisma.poll.count()
    return { count }
  })

  fastify.post("/polls", async (request, replay) => {
    const createPollBody = z.object({
      title: z.string(),
    })

    const { title } = createPollBody.parse(request.body)

    const generateId = new ShortUniqueId({ length: 6 })
    const code = String(generateId()).toUpperCase()

    try {
      await request.jwtVerify()

      await prisma.poll.create({
        data: {
          title,
          code,
          ownerId: request.user.sub,

          participants: {
            create: {
              userId: request.user.sub,
            },
          },
        },
      })
    } catch {
      await prisma.poll.create({
        data: {
          title,
          code,
        },
      })
    }

    return replay.status(201).send({ code })
  })

  fastify.post(
    "/polls/:id/join",
    { onRequest: [authenticate] },
    async (request, replay) => {
      const joinPollBody = z.object({
        code: z.string(),
      })

      // Pega o código do bolão enviado pelo body
      const { code } = joinPollBody.parse(request.body)

      // Locatiza o bolão no banco
      const poll = await prisma.poll.findUnique({
        where: {
          code,
        },
        include: {
          participants: {
            where: {
              userId: request.user.sub,
            },
          },
        },
      })

      if (!poll) {
        return replay.status(400).send({
          message: "Bolão não encontrado",
        })
      }

      // Verifica se o usuário já faz parte do bolão
      if (poll.participants.length > 0) {
        return replay.status(400).send({
          message: "Você já está participando deste bolão.",
        })
      }

      // Coloca o primeiro participante que entra no bolão como dono
      if (!poll.ownerId) {
        await prisma.poll.update({
          where: {
            id: poll.id,
          },
          data: { ownerId: request.user.sub },
        })
      }

      // Registra no banco usuário como participant
      await prisma.participant.create({
        data: {
          pollId: poll.id,
          userId: request.user.sub,
        },
      })

      return replay.status(201).send()
    }
  )

  // Retorna uma lista de todos os bolões onde o usuário participa
  fastify.get("/polls", { onRequest: [authenticate] }, async (request) => {
    // Locatiza todos os bolões que o usuário participa
    const polls = await prisma.poll.findMany({
      where: {
        participants: {
          some: {
            userId: request.user.sub,
          },
        },
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarUrl: true,
              },
            },
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return { polls }
  })
}
