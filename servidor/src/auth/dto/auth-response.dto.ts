import { UserResponseDto } from '../../users/dto/user-response.dto';

export class AuthResponseDto {
  access_token: string;
  user: UserResponseDto;
}
