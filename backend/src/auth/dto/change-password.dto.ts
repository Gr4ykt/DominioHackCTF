import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  current_password: string;

  // Mismas reglas que el registro.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, {
    message: 'new_password debe incluir al menos una mayúscula',
  })
  @Matches(/[0-9]/, { message: 'new_password debe incluir al menos un número' })
  new_password: string;
}
