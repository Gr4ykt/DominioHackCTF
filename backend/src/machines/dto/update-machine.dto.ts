import { PartialType } from '@nestjs/mapped-types';
import { CreateMachineDto } from './create-machine.dto.js';

// Todos los campos opcionales para edición parcial (PATCH).
export class UpdateMachineDto extends PartialType(CreateMachineDto) {}
