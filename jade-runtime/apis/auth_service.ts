import { createHmac, randomUUID } from 'crypto';

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  passwordHash?: string; // nunca exposto externamente
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // segundos
}

export interface TokenPayload {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  exp: number;
  iat: number;
}

export class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, { userId: string; expiresAt: number }> = new Map();
  private jwtSecret: string;
  private tokenExpirySeconds: number;

  constructor(jwtSecret: string = 'jade-secret-key', tokenExpirySeconds: number = 86400) {
    this.jwtSecret = jwtSecret;
    this.tokenExpirySeconds = tokenExpirySeconds;
  }

  // Registra usuário no sistema
  async register(userData: {
    username: string;
    email: string;
    password: string;
    roles?: string[];
    permissions?: string[];
  }): Promise<Omit<User, 'passwordHash'>> {
    if (this.findUserByUsername(userData.username)) {
      throw new Error(`Usuário '${userData.username}' já existe`);
    }

    const user: User = {
      id: this.generateId(),
      username: userData.username,
      email: userData.email,
      roles: userData.roles ?? ['usuario'],
      permissions: userData.permissions ?? [],
      passwordHash: this.hashPassword(userData.password)
    };

    this.users.set(user.id, user);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // Login — retorna tokens
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    const user = this.findUserByUsername(credentials.username);
    if (!user) {
      throw new Error('Usuário ou senha inválidos');
    }

    const hash = this.hashPassword(credentials.password);
    if (hash !== user.passwordHash) {
      throw new Error('Usuário ou senha inválidos');
    }

    const expiresIn = credentials.rememberMe
      ? this.tokenExpirySeconds * 7  // 7 dias
      : this.tokenExpirySeconds;     // 1 dia

    const accessToken = this.generateToken(user, expiresIn);
    const refreshToken = this.generateId();

    this.sessions.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + expiresIn * 1000
    });

    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken, expiresIn };
  }

  // Logout — invalida refresh token
  async logout(refreshToken: string): Promise<void> {
    this.sessions.delete(refreshToken);
  }

  // Verifica token JWT e retorna payload
  verifyToken(token: string): TokenPayload {
    try {
      const [headerB64, payloadB64, signature] = token.split('.');
      const expectedSig = this.sign(`${headerB64}.${payloadB64}`);

      if (signature !== expectedSig) {
        throw new Error('Assinatura inválida');
      }

      const payload: TokenPayload = JSON.parse(
        Buffer.from(payloadB64, 'base64url').toString()
      );

      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expirado');
      }

      return payload;
    } catch (e: any) {
      throw new Error(`Token inválido: ${e.message}`);
    }
  }

  // Refresh — gera novo access token
  async refreshToken(refreshToken: string): Promise<string> {
    const session = this.sessions.get(refreshToken);
    if (!session || session.expiresAt < Date.now()) {
      this.sessions.delete(refreshToken);
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const user = this.users.get(session.userId);
    if (!user) throw new Error('Usuário não encontrado');

    return this.generateToken(user, this.tokenExpirySeconds);
  }

  // Utilitários privados
  private findUserByUsername(username: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  private hashPassword(password: string): string {
    return createHmac('sha256', this.jwtSecret)
      .update(password)
      .digest('hex');
  }

  private generateToken(user: User, expiresIn: number): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .toString('base64url');

    const payload = Buffer.from(JSON.stringify({
      userId: user.id,
      username: user.username,
      roles: user.roles,
      permissions: user.permissions,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + expiresIn
    })).toString('base64url');

    const signature = this.sign(`${header}.${payload}`);
    return `${header}.${payload}.${signature}`;
  }

  private sign(data: string): string {
    return createHmac('sha256', this.jwtSecret)
      .update(data)
      .digest('base64url');
  }

  private generateId(): string {
    return randomUUID();
  }
}
