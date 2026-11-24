import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  apiloToken?: string;
}

export class ConnectApiloDto {
  @IsString()
  @IsNotEmpty()
  authorizationCode: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  clientSecret?: string;
}
