import { IsEnum } from 'class-validator';
import { Role } from '../../generated/prisma/enums.js';

export class ChangeRoleDto {
  @IsEnum(Role)
  role: Role;
}
