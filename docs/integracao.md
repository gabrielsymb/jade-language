# Guia de Integração com Ferramentas

Este documento descreve como integrar JADE com ferramentas e ecossistemas existentes de desenvolvimento.

## IDEs e Editores

### Visual Studio Code

#### Extensão JADE Oficial

```json
{
  "name": "jade-lang",
  "displayName": "JADE Language Support",
  "description": "Suporte completo para linguagem JADE",
  "version": "1.0.0",
  "publisher": "jade-lang",
  "engines": {
    "vscode": "^1.74.0"
  },
  "categories": ["Programming Languages"],
  "contributes": {
    "languages": [{
      "id": "jade",
      "aliases": ["JADE", "jade"],
      "extensions": [".jade"],
      "configuration": "./language-configuration.json"
    }],
    "grammars": [{
      "language": "jade",
      "scopeName": "source.jade",
      "path": "./syntaxes/jade.tmLanguage.json"
    }]
  }
}
```

#### Configuração do Workspace

```json
// .vscode/settings.json
{
  "jade.compiler.path": "node_modules/.bin/jade",
  "jade.compiler.args": ["--optimize"],
  "jade.runtime.path": "node_modules/@jade-lang/runtime",
  "jade.format.enabled": true,
  "jade.lint.enabled": true,
  "jade.debug.enabled": true,
  "files.associations": {
    "*.jade": "jade"
  },
  "emmet.includeLanguages": ["jade"]
}
```

#### Configuração com Bun

```json
// .vscode/settings.json
{
  "jade.runtime": "bun",
  "jade.compiler.path": "bun",
  "jade.compiler.args": ["run", "build"],
  "jade.packageManager": "bun",
  "jade.testRunner": "bun",
  "jade.format.enabled": true,
  "jade.lint.enabled": true,
  "jade.debug.enabled": true,
  "files.associations": {
    "*.jade": "jade"
  },
  "emmet.includeLanguages": ["jade"],
  "terminal.integrated.defaultProfile.linux": "bun",
  "terminal.integrated.defaultProfile.osx": "bun",
  "terminal.integrated.defaultProfile.windows": "bun"
}
```

#### Tasks e Launch

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build JADE",
      "type": "shell",
      "command": "jade",
      "args": ["build"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": ["$jade"]
    },
    {
      "label": "Run JADE",
      "type": "shell",
      "command": "jade",
      "args": ["run"],
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}

// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug JADE",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jade",
      "args": ["run", "--debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

#### Tasks e Launch (Bun)

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build JADE (Bun)",
      "type": "shell",
      "command": "bun",
      "args": ["run", "build"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": ["$jade"]
    },
    {
      "label": "Run JADE (Bun)",
      "type": "shell",
      "command": "bun",
      "args": ["run", "dev"],
      "group": {
        "kind": "test",
        "isDefault": true
      }
    },
    {
      "label": "Test JADE (Bun)",
      "type": "shell",
      "command": "bun",
      "args": ["test"],
      "group": "test"
    }
  ]
}

// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug JADE (Bun)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/bun",
      "args": ["run", "dev", "--debug"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "env": {
        "BUN_RUNTIME": "debug"
      }
    }
  ]
}
```

#### Configuração Dual (Node.js + Bun)

```json
// .vscode/tasks.json - suporte dual runtime
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Build JADE (Node.js)",
      "type": "shell",
      "command": "jade",
      "args": ["build"],
      "group": "build"
    },
    {
      "label": "Build JADE (Bun)",
      "type": "shell",
      "command": "bun",
      "args": ["run", "build"],
      "group": "build"
    }
  ]
}
```

### IntelliJ IDEA

#### Plugin JADE

```xml
<!-- plugin.xml -->
<idea-plugin>
  <id>com.jade.lang</id>
  <name>JADE Language Support</name>
  <vendor>JADE Team</vendor>

  <depends>com.intellij.modules.platform</depends>
  <depends>com.intellij.modules.lang</depends>

  <extensions defaultExtensionNs="com.intellij">
    <fileType name="JADE File"
              implementationClass="com.jade.lang.JadeFileType"
              fieldName="INSTANCE"
              language="JADE"
              extensions="jade"/>

    <lang.parserDefinition language="JADE"
                         implementationClass="com.jade.lang.JadeParserDefinition"/>

    <lang.syntaxHighlighterFactory language="JADE"
                                 implementationClass="com.jade.lang.JadeSyntaxHighlighterFactory"/>
  </extensions>
</idea-plugin>
```

#### Configuração do Projeto

```xml
<!-- .idea/modules.xml -->
<project version="4">
  <component name="ProjectModuleManager">
    <modules>
      <module fileurl="file://$PROJECT_DIR$/.idea/meu-projeto.iml" filepath="$PROJECT_DIR$/.idea/meu-projeto.iml" />
    </modules>
  </component>
</project>

<!-- .idea/meu-projeto.iml -->
<module type="JAVA_MODULE" version="4">
  <component name="NewModuleRootManager" inherit-compiler-output="true">
    <exclude-output />
    <content url="file://$MODULE_DIR$">
      <sourceFolder url="file://$MODULE_DIR$/src" isTestSource="false" />
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
</module>
```

## Build Tools

### Webpack

#### Configuração Básica

```javascript
// webpack.config.js
const JadeLoader = require('@jade-lang/webpack-loader');

module.exports = {
  entry: './src/main.jade',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jade$/,
        use: [
          {
            loader: '@jade-lang/webpack-loader',
            options: {
              target: 'webassembly',
              optimize: true,
              sourceMap: process.env.NODE_ENV === 'development'
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.jade', '.js', '.wasm']
  },
  experiments: {
    asyncWebAssembly: true
  }
};
```

#### Plugin de Otimização

```javascript
// webpack.optimize.js
const JadeWebpackPlugin = require('@jade-lang/webpack-plugin');

module.exports = {
  plugins: [
    new JadeWebpackPlugin({
      outputPath: 'dist',
      optimizationLevel: 'O3',
      enableDeadCodeElimination: true,
      generateSourceMap: true,
      compressOutput: true
    })
  ]
};
```

### Vite

#### Configuração

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import jade from '@jade-lang/vite-plugin';

export default defineConfig({
  plugins: [
    jade({
      target: 'webassembly',
      optimize: true,
      devMode: process.env.NODE_ENV === 'development'
    })
  ],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: './src/main.jade'
    }
  },
  server: {
    fs: {
      allow: ['..']
    }
  }
});
```

### Rollup

#### Configuração

```javascript
// rollup.config.js
import jade from '@jade-lang/rollup-plugin';

export default {
  input: 'src/main.jade',
  output: {
    file: 'dist/bundle.js',
    format: 'es'
  },
  plugins: [
    jade({
      target: 'webassembly',
      optimize: true,
      sourceMap: true
    })
  ]
};
```

## Test Frameworks

### Jest

#### Configuração

```json
// jest.config.json
{
  "preset": "@jade-lang/jest-preset",
  "testEnvironment": "node",
  "testMatch": [
    "**/__tests__/**/*.jade",
    "**/?(*.)+(spec|test).jade"
  ],
  "transform": {
    "\\.jade$": "@jade-lang/jest-transformer"
  },
  "collectCoverageFrom": [
    "src/**/*.jade"
  ],
  "coverageReporters": ["text", "lcov", "html"]
}
```

#### Exemplo de Teste

```jade
// __tests__/ProdutoService.test.jade
teste "criar produto com sucesso"
    // Arrange
    dados = {
        nome: "Notebook",
        preco: 4500,
        estoque: 10
    }

    // Act
    produto = ProdutoService.criarProduto(dados)

    // Assert
    afirmar produto.nome == "Notebook"
    afirmar produto.preco == 4500
    afirmar produto.estoque == 10
    afirmar produto.ativo == verdadeiro
fim

teste "validar produto sem nome deve falhar"
    // Arrange
    dados = {
        nome: "",
        preco: 100,
        estoque: 5
    }

    // Act & Assert
    erro = erro.aoExecutar(() -> validarProduto(dados))
    afirmar erro.contem("Nome é obrigatório")
fim

teste suite "busca de produtos"
    antesDeCada
        ProdutoService.limparDados()
    fim

    teste "buscar produto existente"
        produto = ProdutoService.criarProduto({
            nome: "Mouse",
            preco: 50,
            estoque: 20
        })

        encontrado = ProdutoService.buscarPorId(produto.id)
        afirmar encontrado.id == produto.id
    fim

    teste "buscar produto inexistente retorna nulo"
        encontrado = ProdutoService.buscarPorId("inexistente")
        afirmar encontrado == nulo
    fim
fim
```

### Cypress

#### Configuração

```javascript
// cypress.config.js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        compileJade({ filePath }) {
          const jade = require('@jade-lang/compiler');
          return jade.compileFile(filePath);
        }
      });
    },
    supportFile: 'cypress/support/e2e.js'
  }
});
```

#### Comandos Customizados

```javascript
// cypress/support/e2e.js
Cypress.Commands.add('compileJade', (jadeCode) => {
  cy.task('compileJade', { jadeCode }).then(result => {
    return result;
  });
});

Cypress.Commands.add('visitJade', (jadeFile) => {
  cy.task('compileJade', { filePath: jadeFile }).then(compiled => {
    cy.visit('index.html', {
      onBeforeLoad(win) {
        win.jadeApp = compiled;
      }
    });
  });
});
```

## CI/CD Integration

### GitHub Actions

#### Workflow de Build

```yaml
# .github/workflows/jade.yml
name: JADE CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Install JADE CLI
        run: npm install -g @jade-lang/cli

      - name: Install dependencies
        run: npm ci

      - name: Lint JADE files
        run: jade lint src/

      - name: Type check
        run: jade type-check src/

      - name: Run tests
        run: jade test

      - name: Build application
        run: jade build --production

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-${{ matrix.node-version }}
          path: dist/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: dist-18.x
          path: dist/

      - name: Deploy to production
        run: |
          # Script de deploy
          echo "Deploying to production..."
```

### GitLab CI

#### Configuração

```yaml
# .gitlab-ci.yml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

cache:
  paths:
    - node_modules/

before_script:
  - npm ci

lint:
  stage: lint
  script:
    - npm install -g @jade-lang/cli
    - jade lint src/
  artifacts:
    reports:
      junit: reports/lint.xml

test:
  stage: test
  script:
    - npm install -g @jade-lang/cli
    - jade test --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      junit: reports/tests.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  script:
    - npm install -g @jade-lang/cli
    - jade build --production
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

deploy:
  stage: deploy
  script:
    - echo "Deploying to production..."
    # Script de deploy
  only:
    - main
```

## Docker Integration

### Dockerfile Multi-stage

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install JADE CLI
RUN npm install -g @jade-lang/cli

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build JADE application
RUN jade build --production --optimize

# Production stage
FROM nginx:alpine

# Copy built artifacts
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/var/log/nginx
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: jade_app
      POSTGRES_USER: jade_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  jade-cli:
    image: node:18-alpine
    volumes:
      - .:/app
      - /app/node_modules
    working_dir: /app
    command: sh -c "npm install -g @jade-lang/cli && jade dev"
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
  redis_data:
```

## Cloud Integration

### AWS

#### Lambda Function

```javascript
// lambda-handler.js
const { JADERuntime } = require('@jade-lang/aws-lambda');

exports.handler = async (event, context) => {
  const runtime = new JADERuntime({
    entryPoint: './src/main.jade',
    environment: 'lambda'
  });

  await runtime.initialize();

  return await runtime.handleRequest(event, context);
};
```

#### CloudFormation Template

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  JadeFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: lambda-handler.handler
      Runtime: nodejs18.x
      CodeUri: dist/
      MemorySize: 512
      Timeout: 30
      Environment:
        Variables:
          NODE_ENV: production
          DB_HOST: !Ref DatabaseHost
      Events:
        Api:
          Type: HttpApi
          PayloadFormatVersion: '2.0'

  Database:
    Type: AWS::RDS::Instance
    Properties:
      DBInstanceIdentifier: jade-db
      DBInstanceClass: db.t3.micro
      Engine: postgres
      EngineVersion: '15'
      MasterUsername: jade
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: 20
```

### Vercel

#### Configuração

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "src/**/*.jade",
      "use": "@jade-lang/vercel-builder"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/$1"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "api/**/*.jade": {
      "maxDuration": 10
    }
  }
}
```

### Netlify

#### Build Configuration

```toml
# netlify.toml
[build]
  command = "jade build --production"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[functions]
  directory = "functions"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

## Monitoring Integration

### DataDog

#### Configuração

```javascript
// datadog-integration.js
const { JADEMetrics } = require('@jade-lang/datadog');

const metrics = new JADEMetrics({
  apiKey: process.env.DATADOG_API_KEY,
  site: 'datadoghq.com',
  prefix: 'jade.app.'
});

// Monitor performance
metrics.trackExecutionTime('function_call', () => {
  // Your JADE function
});

// Monitor memory
metrics.trackMemoryUsage();

// Monitor custom metrics
metrics.increment('user.login');
metrics.gauge('active.users', userCount);
```

### New Relic

#### Configuração

```javascript
// newrelic-integration.js
const { JADENewRelic } = require('@jade-lang/newrelic');

const newrelic = new JADENewRelic({
  licenseKey: process.env.NEW_RELIC_LICENSE_KEY,
  appName: 'jade-application'
});

// Track transactions
newrelic.startTransaction('user_registration');
// ... your code
newrelic.endTransaction();

// Track errors
try {
  // Your code
} catch (error) {
  newrelic.noticeError(error);
}
```

## Database Integration

### PostgreSQL

#### Connection Pool

```javascript
// postgres-integration.js
const { JADEPostgres } = require('@jade-lang/postgres');

const db = new JADEPostgres({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  pool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
  }
});

// Use in JADE entities
module.exports = {
  connect: () => db.connect(),
  query: (sql, params) => db.query(sql, params),
  transaction: (callback) => db.transaction(callback)
};
```

### MongoDB

#### Integration

```javascript
// mongodb-integration.js
const { JADEMongoDB } = require('@jade-lang/mongodb');

const mongo = new JADEMongoDB({
  url: process.env.MONGODB_URL,
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
});

// Use in JADE entities
module.exports = {
  connect: () => mongo.connect(),
  getCollection: (name) => mongo.collection(name),
  close: () => mongo.close()
};
```

## Security Integration

### OAuth 2.0

```javascript
// oauth-integration.js
const { JADEOAuth } = require('@jade-lang/oauth');

const oauth = new JADEOAuth({
  provider: 'google',
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT_URI
});

// Use in JADE auth service
module.exports = {
  getAuthUrl: () => oauth.getAuthUrl(),
  exchangeCode: (code) => oauth.exchangeCode(code),
  getUserInfo: (token) => oauth.getUserInfo(token)
};
```

### JWT

```javascript
// jwt-integration.js
const { JADEJWT } = require('@jade-lang/jwt');

const jwt = new JADEJWT({
  secret: process.env.JWT_SECRET,
  algorithm: 'HS256',
  expiresIn: '24h'
});

// Use in JADE auth service
module.exports = {
  sign: (payload) => jwt.sign(payload),
  verify: (token) => jwt.verify(token),
  refresh: (token) => jwt.refresh(token)
};
```

## Performance Integration

### Redis Cache

```javascript
// redis-integration.js
const { JADERedis } = require('@jade-lang/redis');

const redis = new JADERedis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  db: 0
});

// Use in JADE services
module.exports = {
  get: (key) => redis.get(key),
  set: (key, value, ttl) => redis.set(key, value, ttl),
  del: (key) => redis.del(key),
  exists: (key) => redis.exists(key)
};
```

### CDN Integration

```javascript
// cdn-integration.js
const { JADECDN } = require('@jade-lang/cdn');

const cdn = new JADECDN({
  provider: 'cloudflare',
  zoneId: process.env.CLOUDFLARE_ZONE_ID,
  apiKey: process.env.CLOUDFLARE_API_KEY
});

// Use in JADE file service
module.exports = {
  upload: (file, options) => cdn.upload(file, options),
  getUrl: (file) => cdn.getUrl(file),
  delete: (file) => cdn.delete(file)
};
```

## Debugging Tools

### Chrome DevTools

```javascript
// devtools-integration.js
const { JADEDevTools } = require('@jade-lang/devtools');

const devtools = new JADEDevTools({
  port: 9222,
  host: 'localhost'
});

// Enable debugging
devtools.enable();

// Connect to DevTools
devtools.connect().then(session => {
  session.on('console.log', (message) => {
    console.log('JADE:', message);
  });
});
```

### VS Code Debug

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug JADE",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/.bin/jade",
      "args": ["run", "--debug", "--inspect=9229"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"]
    }
  ]
}
```

Este guia cobre as principais integrações possíveis com JADE, permitindo que desenvolvedores usem suas ferramentas preferidas enquanto aproveitam os benefícios da linguagem.
