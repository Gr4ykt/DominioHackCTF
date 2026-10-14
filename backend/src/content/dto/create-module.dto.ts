import {
  IsInt,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateModuleDto {
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug solo admite minúsculas, números y guiones',
  })
  @MaxLength(100)
  slug: string;

  @IsString() @MinLength(2) @MaxLength(255) title_es: string;
  @IsString() @MinLength(2) @MaxLength(255) title_en: string;
  @IsString() @MinLength(1) content_es: string;
  @IsString() @MinLength(1) content_en: string;
  @IsString() @MaxLength(50) category: string;

  @IsInt() @Min(0) order: number;
}
