import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { QuestionType } from '../../generated/prisma/enums.js';

export class OptionInputDto {
  @IsString() @MinLength(1) @MaxLength(500) text_es: string;
  @IsString() @MinLength(1) @MaxLength(500) text_en: string;
  @IsBoolean() is_correct: boolean;
}

export class QuestionInputDto {
  @IsString() @MinLength(1) question_es: string;
  @IsString() @MinLength(1) question_en: string;

  @IsEnum(QuestionType)
  type: QuestionType;

  @IsInt() @Min(0) order: number;

  // Respuesta esperada para fill_blank.
  @IsOptional() @IsString() @MaxLength(255) answer?: string;

  // Opciones para multiple_choice.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => OptionInputDto)
  options?: OptionInputDto[];
}

export class SetQuestionsDto {
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => QuestionInputDto)
  questions: QuestionInputDto[];
}
