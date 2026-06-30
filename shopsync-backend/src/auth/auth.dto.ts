import { IsNotEmpty, IsString } from 'class-validator';

export class LoginShoperDto {
  @IsString()
  @IsNotEmpty()
  login: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class JwtPayload {
  shoperToken: string;
  apiloToken: string;
}
