import { IsEnum } from 'class-validator';
import { InviteRole } from './invite-user.dto';

export class UpdateMemberRoleDto {
  @IsEnum(InviteRole, { message: 'El rol debe ser editor o viewer' })
  role: InviteRole;
}
