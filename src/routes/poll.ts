import { FastifyInstance } from "fastify"
import ShortUniqueId from "short-unique-id"
import { z } from "zod"

import { prisma } from "../lib/prisma"

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
}
