import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { FlagType } from '../../generated/prisma/enums.js';

export class FlagInputDto {
  @IsEnum(FlagType)
  type: FlagType;

  // Valor en texto plano (se guarda solo su hash + salt).
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  value: string;

  @IsInt()
  @Min(0)
  @Max(1000)
  points: number;
}

export class SetFlagsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(2)
  @ValidateNested({ each: true })
  @Type(() => FlagInputDto)
  flags: FlagInputDto[];
}
