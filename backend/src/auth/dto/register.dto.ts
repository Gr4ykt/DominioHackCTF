import {
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

// Mismas reglas que el formulario de registro del frontend.
export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'username solo admite letras, números, guiones y guion bajo',
  })
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  // bcrypt solo considera los primeros 72 bytes.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/[A-Z]/, { message: 'password debe incluir al menos una mayúscula' })
  @Matches(/[0-9]/, { message: 'password debe incluir al menos un número' })
  password: string;
}
