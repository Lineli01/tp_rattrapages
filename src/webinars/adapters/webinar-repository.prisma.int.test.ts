import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';

const asyncExec = promisify(exec);

describe('PrismaWebinarRepository', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let repository: PrismaWebinarRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('test_db')
      .withUsername('user_test')
      .withPassword('password_test')
      .start();

    const dbUrl = container.getConnectionUri();

    prisma = new PrismaClient({
      datasources: {
        db: { url: dbUrl },
      },
    });

    await asyncExec(`DATABASE_URL=${dbUrl} npx prisma migrate deploy`);
    await prisma.$connect();

    repository = new PrismaWebinarRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    await prisma.webinar.deleteMany();
  });

  describe('delete', () => {
    it('should delete a webinar from the database', async () => {
      // Create a webinar
      const webinar = new Webinar({
        id: 'test-id',
        organizerId: 'test-organizer',
        title: 'Test Webinar',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-01'),
        seats: 100,
      });

      // Insert it into the database
      await prisma.webinar.create({
        data: {
          id: webinar.props.id,
          organizerId: webinar.props.organizerId,
          title: webinar.props.title,
          startDate: webinar.props.startDate,
          endDate: webinar.props.endDate,
          seats: webinar.props.seats,
        },
      });

      // Verify it exists
      const dbWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.props.id },
      });
      expect(dbWebinar).not.toBeNull();

      // Delete it
      await repository.delete(webinar);

      // Verify it's gone
      const deletedWebinar = await prisma.webinar.findUnique({
        where: { id: webinar.props.id },
      });
      expect(deletedWebinar).toBeNull();
    });
  });
});