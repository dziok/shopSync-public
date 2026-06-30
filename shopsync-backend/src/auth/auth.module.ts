import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { HttpModule } from '@nestjs/axios';
import { JwtStrategy } from './auth.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Config } from 'src/config/config';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      useFactory: (config: ConfigService<Config>) => {
        return {
          secret: config.get('jwtSecret'),
          signOptions: { expiresIn: '50m' },
        }
      },
      inject: [ConfigService]
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [JwtStrategy, AuthService]
})
export class AuthModule { }
