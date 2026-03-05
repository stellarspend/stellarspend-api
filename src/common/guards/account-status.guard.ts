import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../modules/users/user.entity';

/**
 * Guard that checks if a user's account is suspended.
 * Prevents suspended users from accessing protected endpoints.
 */
@Injectable()
export class AccountStatusGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<import('express').Request & { user?: { userId?: string } }>();
    const userId = request.user?.userId;

    if (!userId) {
      // No user in request, let other guards handle authentication
      return true;
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'isSuspended', 'suspensionReason'],
    });

    if (!user) {
      // User not found, let other guards handle this
      return true;
    }

    if (user.isSuspended) {
      throw new ForbiddenException(
        user.suspensionReason
          ? `Account suspended: ${user.suspensionReason}`
          : 'Account suspended. Please contact support.',
      );
    }

    return true;
  }
}
