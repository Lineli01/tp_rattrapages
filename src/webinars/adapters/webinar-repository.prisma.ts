import { PrismaClient } from '@prisma/client';
import { Webinar } from 'src/webinars/entities/webinar.entity';
import { IWebinarRepository } from 'src/webinars/ports/webinar-repository.interface';

export class PrismaWebinarRepository implements IWebinarRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Webinar | null> {
    const webinar = await this.prisma.webinar.findUnique({
      where: { id },
    });

    if (!webinar) return null;

    return new Webinar({
      id: webinar.id,
      organizerId: webinar.organizerId,
      title: webinar.title,
      startDate: webinar.startDate,
      endDate: webinar.endDate,
      seats: webinar.seats,
    });
  }

  async create(webinar: Webinar): Promise<void> {
    await this.prisma.webinar.create({
      data: {
        id: webinar.props.id,
        organizerId: webinar.props.organizerId,
        title: webinar.props.title,
        startDate: webinar.props.startDate,
        endDate: webinar.props.endDate,
        seats: webinar.props.seats,
      },
    });
    webinar.commit();
  }

  async update(webinar: Webinar): Promise<void> {
    await this.prisma.webinar.update({
      where: { id: webinar.props.id },
      data: {
        title: webinar.props.title,
        startDate: webinar.props.startDate,
        endDate: webinar.props.endDate,
        seats: webinar.props.seats,
      },
    });
    webinar.commit();
  }

  async delete(webinar: Webinar): Promise<void> {
    await this.prisma.webinar.delete({
      where: { id: webinar.props.id },
    });
  }
}