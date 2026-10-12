import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Difficulty, MachineOs } from '../../generated/prisma/enums.js';

export class CreateMachineDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug solo admite minúsculas, números y guiones',
  })
  @MaxLength(100)
  slug: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsOptional()
  @IsEnum(MachineOs)
  os?: MachineOs;

  @IsInt()
  @Min(0)
  @Max(10000)
  points: number;

  // Imagen ya construida (docker/Machines/<Nombre>); no se descarga al iniciar.
  @IsString()
  @MaxLength(255)
  docker_image: string;

  @IsInt()
  @Min(1)
  @Max(65535)
  docker_internal_port: number;

  @IsString()
  @MaxLength(50)
  category: string;

  @IsOptional()
  @IsString()
  writeup_es?: string;

  @IsOptional()
  @IsString()
  writeup_en?: string;
}
