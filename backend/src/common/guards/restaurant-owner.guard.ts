import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class RestaurantOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Super Admin can access any restaurant
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Restaurant Admin must have restaurantId
    if (user.role !== 'RESTAURANT_ADMIN' || !user.restaurantId) {
      throw new ForbiddenException('Not a restaurant admin');
    }

    // Get restaurantId from request (param, body, or query)
    const restaurantId =
      request.params?.restaurantId ||
      request.body?.restaurantId ||
      request.query?.restaurantId;

    // If restaurantId is provided, verify ownership
    if (restaurantId && restaurantId !== user.restaurantId) {
      throw new ForbiddenException('Access denied to this restaurant');
    }

    // Attach restaurantId to request for use in services
    request.restaurantId = user.restaurantId;

    return true;
  }
}
