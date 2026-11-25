import {Injectable, CanActivate, ExecutionContext, UnauthorizedException} from "@nestjs/common";

@Injectable()
export class RapidApiGuard implements  CanActivate {
  canActivate(context: ExecutionContext): boolean {

    const expectedSecret = process.env.RAPIDAPI_PROXY_SECRET;

    if(!expectedSecret) return true;

    const request = context.switchToHttp().getRequest();
    const incomingSecret = request.headers['x-rapidapi-proxy-secret'];

    if(incomingSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid RapidAPI Secret provided');
    }

    return true;
  }
}