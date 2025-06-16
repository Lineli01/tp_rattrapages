import { TestServerFixture } from 'src/tests/fixtures';
import request from 'supertest';

describe('API E2E Tests', () => {
  const fixture = new TestServerFixture();

  beforeAll(async () => {
    await fixture.init();
  }, 60000);

  afterAll(async () => {
    await fixture.stop();
  });

  beforeEach(async () => {
    await fixture.reset();
  });

  describe('DELETE /webinars/:id', () => {
    it('should cancel a webinar and return 200', async () => {
      // Create a user first
      const prisma = fixture.getPrismaClient();
      const userData = {
         id: 'fake-user-id',
         email: 'test@example.com',
         password: 'password'
        };
    
      await prisma.user.create({
        data: userData
     });
    
      // Then create a webinar with this user as organizer
      const webinarData = {
        id: 'test-webinar-id',
        organizerId: 'fake-user-id', // Match the ID used in the route
        title: 'Test Webinar',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-01'),
        seats: 100,
      };
      
      await prisma.webinar.create({
        data: webinarData,
      });

      // Verify it exists
      const webinar = await prisma.webinar.findUnique({
        where: { id: webinarData.id },
      });
      expect(webinar).not.toBeNull();

      // Cancel it
      const response = await request(fixture.getServer())
        .delete(`/webinars/${webinarData.id}`)
        .expect(200);
      
      expect(response.body.message).toBe('Webinar canceled');

      // Verify it's gone
      const canceledWebinar = await prisma.webinar.findUnique({
        where: { id: webinarData.id },
      });
      expect(canceledWebinar).toBeNull();
    });

    it('should return 404 when webinar does not exist', async () => {
      const response = await request(fixture.getServer())
        .delete('/webinars/non-existent-id')
        .expect(404);
      
      expect(response.body.error).toBe('Webinar not found');
    });

    it('should return 401 when user is not the organizer', async () => {
      // Create a webinar with a different organizer
      const prisma = fixture.getPrismaClient();
      const webinarData = {
        id: 'test-webinar-id',
        organizerId: 'different-user-id', // Different from the fake-user-id used in the route
        title: 'Test Webinar',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-06-01'),
        seats: 100,
      };
      
      await prisma.webinar.create({
        data: webinarData,
      });

      const response = await request(fixture.getServer())
        .delete(`/webinars/${webinarData.id}`)
        .expect(401);
      
      expect(response.body.error).toBe('User is not allowed to update this webinar');

      // Verify it still exists
      const webinar = await prisma.webinar.findUnique({
        where: { id: webinarData.id },
      });
      expect(webinar).not.toBeNull();
    });
  });
});