import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

export class JwtAuthGuard extends AuthGuard('jwt') {
    handleRequest<TUser = any>(err: any, jwtPayload: any, info: any, context: ExecutionContext, status?: any): TUser {
        if (err || !jwtPayload) {
            throw new UnauthorizedException()
        }

        return jwtPayload
    }
}