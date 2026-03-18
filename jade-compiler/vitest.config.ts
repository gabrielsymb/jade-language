import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Ambiente Node.js — compilador não usa DOM
    environment: 'node',

    // Diretório de testes
    include: ['tests/**/*.test.ts'],

    // Timeout generoso para testes de WASM (compilação pode ser lenta)
    testTimeout: 30_000,

    // Resolver aliases para imports cross-package (wasm_integration.test.ts)
    alias: {
      // Permite `from '../../jade-runtime/core/runtime'` resolver corretamente
      // tanto em desenvolvimento quanto em CI
    },

    // Cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['lexer/**', 'parser/**', 'ast/**', 'semantic/**', 'codegen/**'],
      exclude: ['dist/**', 'node_modules/**', 'tests/**']
    }
  },

  resolve: {
    // Permite imports TypeScript diretos (sem extensão .js) nos testes
    extensions: ['.ts', '.js'],

    alias: {
      // Resolve o import cross-package do wasm_integration.test.ts
      '../../jade-runtime': path.resolve(__dirname, '../jade-runtime')
    }
  }
});
