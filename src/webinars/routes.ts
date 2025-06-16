import { FastifyInstance } from 'fastify';
import { AppContainer } from 'src/container';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';

export async function webinarRoutes(
  fastify: FastifyInstance,
  container: AppContainer,
) {
  const { organizeWebinarUseCase } = container.useCases;
  const { cancelWebinarUseCase } = container.useCases;

  fastify.post<{
    Body: { title: string; seats: number; startDate: string; endDate: string };
  }>('/webinars', {}, async (request, reply) => {
    const organizeCommand = {
      userId: 'fake-user-id',
      title: request.body.title,
      seats: request.body.seats,
      startDate: new Date(request.body.startDate),
      endDate: new Date(request.body.endDate),
    };

    try {
      await organizeWebinarUseCase.execute(organizeCommand);
      reply.status(200).send({ message: 'Webinar created' });
    } catch (err) {
      if (err instanceof WebinarNotFoundException) {
        return reply.status(404).send({ error: err.message });
      }
      if (err instanceof WebinarNotOrganizerException) {
        return reply.status(401).send({ error: err.message });
      }
      reply.status(500).send({ error: 'An error occurred' });
    }
  });

  fastify.delete<{ Params: { id: string } }>('/webinars/:id', {}, async (request, reply) => {
    try {
      await cancelWebinarUseCase.execute({
        userId: 'fake-user-id',
        webinarId: request.params.id,
      });
      reply.status(200).send({ message: 'Webinar canceled' });
    } catch (err) {
      if (err instanceof WebinarNotFoundException) {
        return reply.status(404).send({ error: err.message });
      }
      if (err instanceof WebinarNotOrganizerException) {
        return reply.status(401).send({ error: err.message });
      }
      reply.status(500).send({ error: 'An error occurred' });
    }
  });
}
