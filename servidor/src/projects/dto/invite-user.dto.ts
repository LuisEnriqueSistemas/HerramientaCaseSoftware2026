import { IsEmail, IsEnum } from 'class-validator';

export enum InviteRole {
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export class InviteUserDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsEnum(InviteRole, { message: 'El rol debe ser editor o viewer' })
  role: InviteRole;
}
