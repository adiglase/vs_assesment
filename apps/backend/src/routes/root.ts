import { type FastifyPluginAsync } from 'fastify'

const root: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.get('/', async function () {
    return { root: true }
  })

  fastify.get('/health', async function () {
    return { ok: true }
  })
}

export default root
