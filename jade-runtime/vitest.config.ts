import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Ambiente Node.js para stdlib e APIs server-side
    // Nota: testes de UI precisariam de jsdom — separar quando chegarem a Vitest
    environment: 'node',

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
