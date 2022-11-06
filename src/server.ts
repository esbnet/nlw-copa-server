import cors from "@fastify/cors";
import jwt from '@fastify/jwt';
import Fastify from "fastify";

import { env } from 'node:process';

import { authRoutes } from "./routes/auth";
import { gameRoutes } from "./routes/game";
import { guessRoutes } from "./routes/guess";
import { poolRoutes } from "./routes/poll";
import { userRoutes } from "./routes/user";

const jwtSecret = String(env.JWT_SECRET)
const serverPort = Number(env.SERVER_PORT)
const hostAccess = String(env.HOST_ACCESS)

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  })

  await fastify.register(cors, {
    origin: true,
  })

  await fastify.register(jwt, {
    secret: jwtSecret
  })

  await fastify.register(authRoutes)
  await fastify.register(gameRoutes)
  await fastify.register(poolRoutes)
  await fastify.register(userRoutes)
  await fastify.register(guessRoutes)
  fastify.listen(
    {
      port: serverPort,
      host: hostAccess,
    },
    () => {
      console.log(" 🚀 Server up and listening on port 3333")
    }
  )
}

bootstrap()
