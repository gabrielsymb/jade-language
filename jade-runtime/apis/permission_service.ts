export class PermissionService {
  private currentUser: {
    roles: string[];
    permissions: string[];
  } | null = null;

  private temporaryPermissions: Map<string, number> = new Map(); // permissão → expiresAt

  // Configura usuário atual (chamado após login)
  setCurrentUser(user: { roles: string[]; permissions: string[] }): void {
    this.currentUser = user;
    this.temporaryPermissions.clear();
  }

  clearCurrentUser(): void {
    this.currentUser = null;
    this.temporaryPermissions.clear();
  }

  // Verifica se tem permissão específica
  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;

    // Verificar permissões temporárias
    const tempExp = this.temporaryPermissions.get(permission);
    if (tempExp && tempExp > Date.now()) return true;

    return this.currentUser.permissions.includes(permission) ||
           this.hasWildcardPermission(permission);
  }

  // Verifica se tem papel específico
  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  // Verifica se tem TODAS as permissões
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(p => this.hasPermission(p));
  }

  // Verifica se tem ALGUMA das permissões
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(p => this.hasPermission(p));
  }

  getUserPermissions(): string[] {
    return [...(this.currentUser?.permissions ?? [])];
  }

  getUserRoles(): string[] {
    return [...(this.currentUser?.roles ?? [])];
  }

  // Adiciona permissão temporária por `durationMs` milissegundos
  addTemporaryPermission(permission: string, durationMs: number): void {
    this.temporaryPermissions.set(permission, Date.now() + durationMs);
  }

  private hasWildcardPermission(permission: string): boolean {
    const parts = permission.split('.');
    for (let i = parts.length - 1; i >= 0; i--) {
      const wildcard = [...parts.slice(0, i), '*'].join('.');
      if (this.currentUser?.permissions.includes(wildcard)) return true;
    }
    return false;
  }
}
