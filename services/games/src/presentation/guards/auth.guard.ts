import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import * as jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

/**
 * Estrutura do payload decodificado e verificado do token OIDC do Keycloak.
 */
export interface KeycloakTokenPayload {
  /** Identificador único do usuário no IdP (Keycloak sub claim). */
  sub: string;
  /** Nome de usuário de preferência do jogador. */
  preferred_username?: string;
  /** E-mail associado do jogador. */
  email?: string;
  /** Emissor do token. */
  iss?: string;
  /** Tempo de expiração (Unix timestamp). */
  exp?: number;
}

/**
 * Guard de autenticação que intercepta requisições HTTP e valida a assinatura criptográfica RS256
 * dos tokens JWT emitidos pelo Keycloak contra a URL de JWKS pública.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private client = jwksClient({
    jwksUri:
      process.env.KEYCLOAK_JWKS_URI ||
      "http://keycloak:8080/realms/crash-game/protocol/openid-connect/certs",
    cache: true,
    rateLimit: true,
  });

  /**
   * Determina se a requisição possui permissão para prosseguir com base na integridade do JWT.
   *
   * @param context Contexto de execução do NestJS.
   * @returns Booleano indicando se o acesso é autorizado.
   * @throws UnauthorizedException Se o token estiver ausente, expirado ou for inválido.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];

    try {
      // Bypass para testes unitários/integração locais onde o Keycloak não está disponível
      if (process.env.NODE_ENV === "test" && token === "mock-token") {
        request.user = {
          id: "player-test-uuid-12345",
          username: "player_test",
        };
        return true;
      }

      const decoded = jwt.decode(token, { complete: true }) as {
        header: { kid?: string };
      } | null;

      if (!decoded || !decoded.header.kid) {
        throw new UnauthorizedException("Invalid token structure");
      }

      const signingKey = await this.client.getSigningKey(decoded.header.kid);
      const publicKey = signingKey.getPublicKey();

      const verified = jwt.verify(token, publicKey, {
        issuer:
          process.env.KEYCLOAK_ISSUER ||
          "http://localhost:8080/realms/crash-game",
      }) as KeycloakTokenPayload;

      // Anexa os dados do usuário autenticado diretamente no request object
      request.user = {
        id: verified.sub,
        username: verified.preferred_username || "player",
      };

      return true;
    } catch (err: any) {
      throw new UnauthorizedException(
        `Token verification failed: ${err.message}`
      );
    }
  }
}
