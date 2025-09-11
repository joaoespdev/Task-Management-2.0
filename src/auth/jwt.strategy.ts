import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'changeme',
    });
  }

  /*async validate(payload: { sub: number; email: string }) {
    // o retorno vira req.user
    return { userId: payload.sub, email: payload.email };
  }*/

  //RETIRAR APÓS RESOLVER PROBLEMA TOKEN JWT INVALIDO 401 REQUEST, e tirar comentário acima
  async validate(payload: any) {
    this.logger.debug('JWT Payload recebido:', payload);

    if (!payload.sub || !payload.email) {
      this.logger.error('Payload JWT inválido:', payload);
      throw new Error('Payload JWT inválido');
    }

    return { userId: payload.sub, email: payload.email };
  }
}
