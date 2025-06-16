import { PrismaClient } from '@prisma/client';
import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';

export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaClient) {}
  
  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return null;
    }
    
    return new User({
      id: user.id,
      email: user.email,
      password: user.password
    });
  }
}