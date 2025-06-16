import { IMailer } from 'src/core/ports/mailer.interface';
import { Executable } from 'src/shared/executable';
import { WebinarNotFoundException } from 'src/webinars/exceptions/webinar-not-found';
import { WebinarNotOrganizerException } from 'src/webinars/exceptions/webinar-not-organizer';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';
import { IUserRepository } from 'src/users/ports/user-repository.interface';

type Request = {
  userId: string;
  webinarId: string;
};

type Response = void;

export class CancelWebinar implements Executable<Request, Response> {
  constructor(
    private readonly webinarRepository: IWebinarRepository,
    private readonly userRepository: IUserRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(data: Request): Promise<Response> {
    const { userId, webinarId } = data;
    
    const webinar = await this.webinarRepository.findById(webinarId);
    if (!webinar) {
      throw new WebinarNotFoundException();
    }
    
    const user = await this.userRepository.findById(userId);
    if (!user || !webinar.isOrganizer(user)) {
      throw new WebinarNotOrganizerException();
    }

    await this.webinarRepository.delete(webinar);
    
    await this.mailer.send({
      to: user.props.email,
      subject: 'Webinar Canceled',
      body: `The webinar "${webinar.props.title}" has been canceled`,
    });
  }
}