import { PrismaClient } from '@prisma/client';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { exec } from 'child_process';
import { promisify } from 'util';
import { User } from 'src/users/entities/user.entity';
import { PrismaUserRepository } from 'src/users/adapters/user-repository.prisma';

const asyncExec = promisify(exec);

describe('PrismaUserRepository', () => {
  let container: StartedPostgreSqlContainer;
  let prisma: PrismaClient;
  let repository: PrismaUserRepository;

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

    repository = new PrismaUserRepository(prisma);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await container.stop();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      // Create a test user in the database
      const testUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        password: 'hashed-password',
      };

      await prisma.user.create({
        data: testUser,
      });

      // Find the user using the repository
      const user = await repository.findById(testUser.id);

      // Verify the user was found and has correct data
      expect(user).not.toBeNull();
      expect(user?.props.id).toBe(testUser.id);
      expect(user?.props.email).toBe(testUser.email);
      expect(user?.props.password).toBe(testUser.password);
    });

    it('should return null when user is not found', async () => {
      const user = await repository.findById('non-existent-id');
      expect(user).toBeNull();
    });
  });
});