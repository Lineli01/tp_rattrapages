import { PrismaClient } from '@prisma/client';
import { RealDateGenerator } from 'src/core/adapters/real-date-generator';
import { RealIdGenerator } from 'src/core/adapters/real-id-generator';
import { PrismaWebinarRepository } from 'src/webinars/adapters/webinar-repository.prisma';
import { OrganizeWebinars } from 'src/webinars/use-cases/organize-webinar';
import { CancelWebinar } from 'src/webinars/use-cases/cancel-webinar';
import { InMemoryMailer } from 'src/core/adapters/in-memory-mailer';
import { PrismaUserRepository } from 'src/users/adapters/user-repository.prisma';


export class AppContainer {
  private prismaClient!: PrismaClient;
  private webinarRepository!: PrismaWebinarRepository;
  private organizeWebinarUseCase!: OrganizeWebinars;
  private cancelWebinarUseCase!: CancelWebinar;
  private userRepository!: PrismaUserRepository;
  private mailer!: InMemoryMailer;

  init(prismaClient: PrismaClient) {
    this.prismaClient = prismaClient;
    this.webinarRepository = new PrismaWebinarRepository(this.prismaClient);
    this.userRepository = new PrismaUserRepository(this.prismaClient);
    this.mailer = new InMemoryMailer();

    // Initialize use cases

    this.organizeWebinarUseCase = new OrganizeWebinars(
      this.webinarRepository,
      new RealIdGenerator(),
      new RealDateGenerator(),
    );

    this.cancelWebinarUseCase = new CancelWebinar(
      this.webinarRepository,
      this.userRepository,
      this.mailer
    );
  }

  getPrismaClient() {
    return this.prismaClient;
  }

  get useCases() {
    return {
      organizeWebinarUseCase: this.organizeWebinarUseCase,
      cancelWebinarUseCase: this.cancelWebinarUseCase,
    };
  }
}

export const container = new AppContainer();
