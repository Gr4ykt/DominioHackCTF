import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'username solo admite letras, números, guiones y guion bajo',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatar_url?: string;
}
