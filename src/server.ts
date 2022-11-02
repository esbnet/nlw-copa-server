import cors from "@fastify/cors"
import { PrismaClient } from "@prisma/client"
import Fastify from "fastify"
import ShortUniqueId from 'short-unique-id'
import { z } from "zod"

const prisma = new PrismaClient({ log: ["query"] })

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  })

  await fastify.register(cors, {
    origin: true,
  })

  fastify.get("/pools/count", async () => {
    const count = await prisma.pool.count()
    return { count }
  })

  fastify.get("/users/count", async () => {
    const count = await prisma.user.count()
    return { count }
  })

  fastify.get("/guesses/count", async () => {
    const count = await prisma.guess.count()
    return { count }
  })


  fastify.post("/pools", async (request, replay) => {
    const createPollBody = z.object({
      title: z.string()
    })

    const { title } = createPollBody.parse(request.body)

    const generateId = new ShortUniqueId({ length: 6 })
    const code = generateId().toString().toUpperCase()

    console.log(code, title)

    await prisma.pool.create({
      data: { title, code }
    })

    return replay.status(201).send({ code })
  })

  await fastify.listen({
    port: 3333,
    host: "0.0.0.0",
  }, () => {
    console.log(" 🚀 Server up and listening on port 3333")
  })
}

bootstrap()
