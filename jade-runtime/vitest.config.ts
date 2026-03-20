import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Ambiente padrão Node.js — stdlib e APIs server-side
    environment: 'node',

    // Testes de UI (UIEngine, componentes DOM) usam happy-dom
    environmentMatchGlobs: [
      ['tests/ui_engine.test.ts', 'happy-dom'],
    ],

    // Timeout global — aumentado para acomodar ambientes com carga (watch mode + build paralelo)
    // Testes com scrypt podem levar mais tempo dependendo da carga da máquina
    testTimeout: 30000,

    // Roda todos os arquivos no mesmo processo fork — evita timeout de inicialização
    // do worker happy-dom quando jade-compiler watch roda em paralelo (Vitest 4+)
    forks: { singleFork: true },

    // Diretório de testes
    include: ['tests/**/*.test.ts'],

    // Cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['core/**', 'apis/**', 'stdlib/**', 'persistence/**'],
      exclude: ['dist/**', 'node_modules/**', 'tests/**', 'ui/**', 'pwa/**']
    }
  },

  resolve: {
    extensions: ['.ts', '.js']
  }
});
