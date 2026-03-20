import { createHmac, scrypt, timingSafeEqual, randomBytes, randomUUID } from 'crypto';

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
  private resetTokens: Map<string, { userId: string; expiraEm: number }> = new Map();
  private jwtSecret: string;
  private tokenExpirySeconds: number;
  private scryptN: number;

  constructor(
    jwtSecret: string,
    tokenExpirySeconds: number = 86400,
    /** Custo do scrypt (N). Padrão: 16384 para produção. Use 1024 em testes. */
    scryptN: number = 16384
  ) {
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error(
        'AuthService: jwtSecret é obrigatório e deve ter no mínimo 32 caracteres. ' +
        'Use uma string aleatória segura (ex: crypto.randomBytes(32).toString("hex")).'
      );
    }
    this.jwtSecret = jwtSecret;
    this.tokenExpirySeconds = tokenExpirySeconds;
    this.scryptN = scryptN;
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
      passwordHash: await this.hashPassword(userData.password)
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

    const senhaValida = await this.verifyPassword(credentials.password, user.passwordHash!);
    if (!senhaValida) {
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

  // Retorna o usuário autenticado a partir de um token JWT válido
  getCurrentUser(token: string): Omit<User, 'passwordHash'> {
    const payload = this.verifyToken(token);
    const user = this.users.get(payload.userId);
    if (!user) throw new Error('Usuário não encontrado');
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  // Altera a senha do usuário verificando a senha atual
  async changePassword(userId: string, senhaAtual: string, novaSenha: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) throw new Error('Usuário não encontrado');
    const valida = await this.verifyPassword(senhaAtual, user.passwordHash!);
    if (!valida) throw new Error('Senha atual incorreta');
    user.passwordHash = await this.hashPassword(novaSenha);
  }

  /**
   * Gera um token de reset de senha válido por 1 hora.
   * Retorna o token — em produção seria enviado por email;
   * aqui é retornado diretamente para integração manual (ex: admin mostra ao usuário).
   * Não vaza se o email não existe: retorna token inválido silenciosamente.
   */
  solicitarResetSenha(email: string): string {
    let userId: string | undefined;
    for (const user of this.users.values()) {
      if (user.email === email) { userId = user.id; break; }
    }

    const token = this.generateId();
    if (userId) {
      this.resetTokens.set(token, { userId, expiraEm: Date.now() + 3_600_000 }); // 1h
    }
    // Se email não existe, retorna token aleatório que nunca estará no map — sem vazamento de info
    return token;
  }

  // Confirma o reset de senha usando o token gerado por solicitarResetSenha
  async confirmarResetSenha(resetToken: string, novaSenha: string): Promise<void> {
    const entrada = this.resetTokens.get(resetToken);
    if (!entrada || Date.now() > entrada.expiraEm) {
      this.resetTokens.delete(resetToken);
      throw new Error('Token de reset inválido ou expirado');
    }
    const user = this.users.get(entrada.userId);
    if (!user) throw new Error('Usuário não encontrado');
    user.passwordHash = await this.hashPassword(novaSenha);
    this.resetTokens.delete(resetToken);
  }

  // Utilitários privados
  private findUserByUsername(username: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  // scrypt com salt aleatório — resistente a brute-force e rainbow tables
  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);
    const hash = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, { N: this.scryptN }, (err, key) => err ? reject(err) : resolve(key));
    });
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  private async verifyPassword(password: string, stored: string): Promise<boolean> {
    const [saltHex, hashHex] = stored.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const expected = Buffer.from(hashHex, 'hex');
    const actual = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, 64, { N: this.scryptN }, (err, key) => err ? reject(err) : resolve(key));
    });
    return timingSafeEqual(actual, expected);
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
