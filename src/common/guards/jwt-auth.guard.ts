import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
/** Protects state-changing routes with bearer-token verification. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}
  /** Verifies the request bearer token. */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Bearer token required');
    try { 
      const payload = this.jwt.verify(token); 
      (request as any).user = payload;
      return true; 
    } catch { throw new UnauthorizedException('Invalid token'); }
  }
}
