import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from 'passport-jwt'
import { JwtPayload } from "./auth.dto";
import { ConfigService } from "@nestjs/config";
import { Config } from "src/config/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService<Config, true>) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get('jwtSecret')
        })
    }

    validate(payload: JwtPayload): JwtPayload {
        if (!(payload.apiloToken || payload.shoperToken)) {
            throw new UnauthorizedException('JWT is missing required parameters')
        }

        return payload
    }
}
