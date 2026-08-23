import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Extracts the authenticated user's ID (JWT `sub` claim) from the bearer token.
 * Must be used on routes protected by JwtAuthGuard (which has already verified
 * the signature), so here we only need to decode — no re-verification required.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ headers: { authorization?: string } }>();
    const token = request.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new UnauthorizedException('Bearer token required');

    // Decode without re-verifying — JwtAuthGuard already verified the signature.
    // Use the global JwtService instance is not available in a param decorator,
    // so we decode the payload section directly (base64url).
    const [, payloadB64] = token.split('.');
    if (!payloadB64) throw new UnauthorizedException('Malformed token');

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Malformed token payload');
    }

    const sub = payload['sub'];
    if (typeof sub !== 'string' || !sub) throw new UnauthorizedException('Token missing sub claim');
    return sub;
  },
);
