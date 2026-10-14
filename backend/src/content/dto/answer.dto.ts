import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class AnswerDto {
  @IsUUID()
  question_id: string;

  // Para multiple_choice: id de la opción. Para fill_blank: el texto.
  @IsString() @MinLength(1) @MaxLength(500) answer: string;
}
