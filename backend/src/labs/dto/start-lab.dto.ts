import { IsUUID } from 'class-validator';

export class StartLabDto {
  @IsUUID()
  machine_id: string;
}
