import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user) {
    // Return user if authenticated, null if not
    // Don't throw error for unauthenticated requests
    return user || null;
  }
}
