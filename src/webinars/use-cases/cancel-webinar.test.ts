import { InMemoryMailer } from 'src/core/adapters/in-memory-mailer';
import { InMemoryWebinarRepository } from 'src/webinars/adapters/webinar-repository.in-memory';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { CancelWebinar } from 'src/webinars/use-cases/cancel-webinar';
import { InMemoryUserRepository } from 'src/users/adapters/user-repository.in-memory';
import { User } from 'src/users/entities/user.entity';
import { testUser } from 'src/users/tests/user-seeds';

describe('Feature: Cancel webinar', () => {
  let webinarRepository: InMemoryWebinarRepository;
  let userRepository: InMemoryUserRepository;
  let mailer: InMemoryMailer;
  let useCase: CancelWebinar;
  
  const webinar = new Webinar({
    id: 'webinar-id',
    organizerId: testUser.alice.props.id,
    title: 'Test Webinar',
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-01'),
    seats: 100,
  });

  beforeEach(() => {
    webinarRepository = new InMemoryWebinarRepository([webinar]);
    userRepository = new InMemoryUserRepository([
      testUser.alice,
      testUser.bob,
    ]);
    mailer = new InMemoryMailer();
    useCase = new CancelWebinar(webinarRepository, userRepository, mailer);
  });

  describe('Scenario: Happy path', () => {
    const request = {
      userId: testUser.alice.props.id,
      webinarId: webinar.props.id,
    };

    it('should cancel the webinar', async () => {
      await useCase.execute(request);
      expect(webinarRepository.database).toHaveLength(0);
    });

    it('should send a notification email to the organizer', async () => {
      await useCase.execute(request);
      expect(mailer.sentEmails).toHaveLength(1);
      expect(mailer.sentEmails[0].to).toBe(testUser.alice.props.email);
      expect(mailer.sentEmails[0].subject).toBe('Webinar Canceled');
      expect(mailer.sentEmails[0].body).toBe('The webinar "Test Webinar" has been canceled');
    });
  });

  describe('Scenario (wrong path): User is not organizer', () => {
    const request = {
      userId: testUser.bob.props.id,
      webinarId: webinar.props.id,
    };

    it('should throw an error and not cancel webinar when user is not the organizer', async () => {
      await expect(useCase.execute(request)).rejects.toThrow(WebinarNotOrganizerException);
      expect(webinarRepository.database).toHaveLength(1);
    });
  });

  describe('Scenario (wrong path): Webinar does not exist', () => {
    const request = {
      userId: testUser.alice.props.id,
      webinarId: 'non-existent-id',
    };

    it('should throw an error when webinar does not exist', async () => {
      await expect(useCase.execute(request)).rejects.toThrow(WebinarNotFoundException);
    });
  });
});