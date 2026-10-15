import { IsString, Matches, MaxLength } from "class-validator";

export class BuscarPersonagemParamsDto {
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;
}