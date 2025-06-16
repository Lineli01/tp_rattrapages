import { User } from 'src/users/entities/user.entity';
import { IUserRepository } from 'src/users/ports/user-repository.interface';

export class InMemoryUserRepository implements IUserRepository {
  constructor(public database: User[] = []) {}
  
  async findById(id: string): Promise<User | null> {
    const user = this.database.find((user) => user.props.id === id);
    return user ? new User({ ...user.initialState }) : null;
  }
}