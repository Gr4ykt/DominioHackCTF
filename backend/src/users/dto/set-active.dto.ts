import { IsBoolean } from 'class-validator';

export class SetActiveDto {
  @IsBoolean()
  is_active: boolean;
}
