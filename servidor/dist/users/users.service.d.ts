import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { type UsersRepository } from './repositories/users-repository.interface';
export declare class UsersService {
    private readonly usersRepository;
    constructor(usersRepository: UsersRepository);
    findById(userId: string): Promise<UserResponseDto>;
    update(userId: string, dto: UpdateProfileDto): Promise<UserResponseDto>;
    remove(userId: string): Promise<void>;
    private toUserResponse;
}
