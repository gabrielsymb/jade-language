# Configuração de Compilação e Deploy

Este documento cobre como configurar, compilar e fazer deploy de aplicações JADE.

## Estrutura de Projeto

### Diretório Padrão

```
/meu-projeto
├── src/
│   ├── modulos/
│   │   ├── estoque.jade
│   │   ├── vendas.jade
│   │   └── financeiro.jade
│   ├── servicos/
│   │   ├── EstoqueService.jade
│   │   └── VendaService.jade
│   ├── entidades/
│   │   ├── Produto.jade
│   │   ├── Cliente.jade
│   │   └── Pedido.jade
│   ├── eventos/
│   │   ├── PedidoCriado.jade
│   │   └── EstoqueBaixo.jade
│   └── ui/
│       ├── telas/
│       │   ├── ListaProdutos.jade
│       │   └── CadastroPedidos.jade
│       └── componentes/
│           └── TabelaProdutos.jade
├── config/
│   ├── jade.config.json
│   ├── database.json
│   └── deploy.json
├── dist/                   # Gerado pelo compilador
├── docs/
├── tests/
└── README.md
```

## Arquivo de Configuração

### jade.config.json

```json
{
  "name": "sistema-estoque",
  "version": "1.0.0",
  "entry": "src/modulos/main.jade",
  "target": "webassembly",
  "output": "dist",
  "optimization": {
    "enabled": true,
    "level": "O2",
    "deadCodeElimination": true,
    "inlining": true,
    "constantFolding": true
  },
  "pwa": {
    "enabled": true,
    "name": "Sistema de Estoque",
    "shortName": "Estoque",
    "description": "Sistema empresarial de controle de estoque",
    "themeColor": "#0066cc",
    "backgroundColor": "#ffffff",
    "display": "standalone",
    "orientation": "portrait",
    "offline": true
  },
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "estoque_db",
    "username": "postgres",
    "password": "${DB_PASSWORD}",
    "ssl": true,
    "poolSize": 10
  },
  "runtime": {
    "maxMemory": "512MB",
    "maxConnections": 100,
    "sessionTimeout": 3600,
    "logLevel": "info",
    "enableProfiling": false,
    "enableJIT": true
  },
  "security": {
    "cors": {
      "enabled": true,
      "origins": ["http://localhost:3000", "https://meusistema.com"]
    },
    "rateLimit": {
      "enabled": true,
      "maxRequests": 100,
      "windowMs": 900000
    },
    "authentication": {
      "type": "jwt",
      "secret": "${JWT_SECRET}",
      "expiresIn": "24h"
    }
  },
  "build": {
    "sourceMap": true,
    "minify": true,
    "analyze": false,
    "reportCompressedSize": true
  }
}
```

### Variáveis de Ambiente

#### .env (desenvolvimento)

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=estoque_dev
DB_USER=postgres
DB_PASSWORD=dev_password

# Security
JWT_SECRET=dev_secret_key_123
SESSION_SECRET=dev_session_secret

# API Keys
EMAIL_API_KEY=dev_email_key
PAYMENT_API_KEY=dev_payment_key

# Runtime
NODE_ENV=development
LOG_LEVEL=debug
PORT=3000
```

#### .env.production

```bash
# Database
DB_HOST=prod-db-server.com
DB_PORT=5432
DB_NAME=estoque_prod
DB_USER=app_user
DB_PASSWORD=${PROD_DB_PASSWORD}

# Security
JWT_SECRET=${PROD_JWT_SECRET}
SESSION_SECRET=${PROD_SESSION_SECRET}

# API Keys
EMAIL_API_KEY=${PROD_EMAIL_KEY}
PAYMENT_API_KEY=${PROD_PAYMENT_KEY}

# Runtime
NODE_ENV=production
LOG_LEVEL=info
PORT=443
```

## Compilação

### CLI JADE

#### Instalação

```bash
# Global (Node.js)
npm install -g @jade-lang/cli

# Global (Bun) - recomendado para performance
bun install -g @jade-lang/cli

# Local no projeto (Node.js)
npm install --save-dev @jade-lang/cli

# Local no projeto (Bun) - recomendado
bun add --dev @jade-lang/cli
```

#### Comandos Básicos

```bash
# Criar novo projeto
jade create meu-projeto

# Compilar projeto (Node.js)
jade build

# Compilar projeto (Bun) - 3x mais rápido
bun run build

# Compilar para produção
jade build --production
bun run build --production

# Compilar com otimizações
jade build --optimize
bun run build --optimize

# Executar em modo desenvolvimento
jade dev
bun run dev

# Executar testes
jade test
bun test  # nativo, mais rápido

# Analisar código
jade analyze
bun run analyze

# Limpar build
jade clean
bun run clean
```

#### Scripts de Build (Dual Runtime)

```json
{
  "name": "sistema-estoque",
  "version": "1.0.0",
  "scripts": {
    "dev": "jade dev",
    "dev:bun": "bun run dev",
    "build": "jade build",
    "build:bun": "bun run build",
    "build:prod": "jade build --production --optimize",
    "build:prod:bun": "bun run build --production --optimize",
    "build:analyze": "jade build --analyze",
    "test": "jade test",
    "test:bun": "bun test",
    "test:watch": "jade test --watch",
    "test:watch:bun": "bun test --watch",
    "lint": "jade lint",
    "lint:fix": "jade lint --fix",
    "clean": "jade clean",
    "deploy": "jade deploy",
    "deploy:staging": "jade deploy --env staging",
    "deploy:production": "jade deploy --env production"
  },
  "devDependencies": {
    "@jade-lang/cli": "^1.0.0",
    "@jade-lang/testing": "^1.0.0"
  },
  "packageManager": "bun@latest"
}
```

## Configurações Avançadas

### Otimizações

#### Níveis de Otimização

```json
{
  "optimization": {
    "level": "O3",
    "passes": [
      "deadCodeElimination",
      "constantFolding",
      "functionInlining",
      "loopUnrolling",
      "commonSubexpressionElimination"
    ],
    "thresholds": {
      "inlineFunctionSize": 50,
      "loopUnrollLimit": 10,
      "constantPropagationDepth": 5
    }
  }
}
```

#### Configuração de WebAssembly

```json
{
  "webassembly": {
    "features": [
      "bulk-memory",
      "mutable-globals",
      "sign-ext",
      "multi-value"
    ],
    "memory": {
      "initial": 256,
      "maximum": 65536,
      "shared": false
    },
    "table": {
      "initial": 1024,
      "maximum": 65536
    }
  }
}
```

### Configuração de Runtime

#### Performance

```json
{
  "runtime": {
    "performance": {
      "enableJIT": true,
      "jitThreshold": 1000,
      "enableInlining": true,
      "enableOptimization": true,
      "gc": {
        "type": "generational",
        "youngGenerationSize": "16MB",
        "oldGenerationSize": "256MB",
        "collectionThreshold": 0.8,
        "maxPauseTime": 50
      }
    }
  }
}
```

#### Debugging

```json
{
  "runtime": {
    "debugging": {
      "enableSourceMap": true,
      "enableStackTrace": true,
      "enableProfiler": true,
      "enableMemoryProfiler": true,
      "logLevel": "debug",
      "traceExecution": false
    }
  }
}
```

## Deploy

### Deploy para Produção

#### Build de Produção

```bash
# Compilar para produção (Node.js)
jade build --production --optimize

# Compilar para produção (Bun) - recomendado
bun run build --production --optimize

# Gerar artefatos
jade package --format docker
jade package --format static
bun run package --format docker
```

#### Docker

##### Dockerfile (Otimizado para Bun)

```dockerfile
# Build stage com Bun
FROM oven/bun:1 AS builder
WORKDIR /app

# Instalar dependências com Bun (mais rápido)
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copiar código fonte
COPY . .

# Build com Bun (3x mais rápido)
RUN bun run build:prod

# Production stage
FROM nginx:alpine

# Copiar artefatos JADE
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Expor porta
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

##### docker-compose.yml (Suporte Dual)

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      target: builder
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
      - RUNTIME=bun  # ou node
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/var/log/nginx
    restart: unless-stopped

  app-node:
    build:
      context: .
      target: builder
    environment:
      - RUNTIME=node
    profiles:
      - node

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: estoque_prod
      POSTGRES_USER: app_user
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

volumes:
  postgres_data:
  redis_data:
```

### Deploy em Cloud

#### AWS

##### AWS SAM Template (Suporte Bun)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  JadeFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: index.handler
      Runtime: nodejs18.x
      CodeUri: dist/
      MemorySize: 512
      Timeout: 30
      Environment:
        Variables:
          NODE_ENV: production
          RUNTIME: bun  # ou node
          DB_HOST: !Ref DatabaseHost
          DB_PASSWORD: !Ref DatabasePassword
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
      MasterUsername: postgres
      MasterUserPassword: !Ref DatabasePassword
      AllocatedStorage: 20
      StorageType: gp2
```

#### Vercel

##### vercel.json (Suporte Bun)

```json
{
  "version": 2,
  "buildCommand": "bun run build:prod",
  "builds": [
    {
      "src": "dist/**",
      "use": "@vercel/static"
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
    "NODE_ENV": "production",
    "RUNTIME": "bun"
  },
  "functions": {
    "api/**/*.jade": {
      "maxDuration": 10
    }
  },
  "framework": null
}
```

### Deploy Contínuo (CI/CD)

#### GitHub Actions (Suporte Dual)

##### .github/workflows/deploy.yml

```yaml
name: Deploy JADE Application

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
        runtime: [node, bun]
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        if: matrix.runtime == 'node'
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Setup Bun
        if: matrix.runtime == 'bun'
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: latest

      - name: Install dependencies
        if: matrix.runtime == 'node'
        run: npm ci

      - name: Install dependencies (Bun)
        if: matrix.runtime == 'bun'
        run: bun install --frozen-lockfile

      - name: Install JADE CLI
        if: matrix.runtime == 'node'
        run: npm install -g @jade-lang/cli

      - name: Install JADE CLI (Bun)
        if: matrix.runtime == 'bun'
        run: bun install -g @jade-lang/cli

      - name: Run tests (Node.js)
        if: matrix.runtime == 'node'
        run: jade test

      - name: Run tests (Bun)
        if: matrix.runtime == 'bun'
        run: bun test

      - name: Build application (Node.js)
        if: matrix.runtime == 'node'
        run: jade build --production

      - name: Build application (Bun)
        if: matrix.runtime == 'bun'
        run: bun run build --production

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist-${{ matrix.runtime }}-${{ matrix.node-version }}
          path: dist/

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Download artifacts (Bun)
        uses: actions/download-artifact@v3
        with:
          name: dist-bun-18.x
          path: dist/

      - name: Deploy to staging
        run: |
          echo "Deploying to staging with Bun..."
          # Script de deploy

      - name: Performance comparison
        run: |
          echo "Bun build time: ${{ env.BUILD_TIME }}"
          echo "Bundle size: $(du -sh dist/)"
```

#### GitLab CI (Suporte Bun)

##### .gitlab-ci.yml

```yaml
stages:
  - lint
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"
  RUNTIME: "bun"

cache:
  paths:
    - node_modules/
    - .bun/

before_script:
  - |
    if [ "$RUNTIME" = "bun" ]; then
      curl -fsSL https://bun.sh/install | bash
      export BUN_INSTALL="$HOME/.bun"
      export PATH="$BUN_INSTALL/bin:$PATH"
      bun install --frozen-lockfile
    else
      npm ci
    fi

lint:
  stage: lint
  script:
    - |
      if [ "$RUNTIME" = "bun" ]; then
        bun run lint
      else
        npm run lint
      fi
  artifacts:
    reports:
      junit: reports/lint.xml

test:
  stage: test
  script:
    - |
      if [ "$RUNTIME" = "bun" ]; then
        bun test --coverage
      else
        npm test
      fi
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
    - |
      if [ "$RUNTIME" = "bun" ]; then
        bun run build --production
      else
        npm run build --production
      fi
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

deploy:
  stage: deploy
  script:
    - echo "Deploying to production with $RUNTIME..."
  only:
    - main
```

### Métricas de Performance

```json
{
  "metrics": {
    "enabled": true,
    "endpoint": "/metrics",
    "collect": [
      "http_requests_total",
      "http_request_duration_ms",
      "memory_usage_bytes",
      "gc_pause_duration_ms",
      "active_connections"
    ],
    "exporters": [
      {
        "type": "prometheus",
        "port": 9090
      },
      {
        "type": "datadog",
        "apiKey": "${DATADOG_API_KEY}"
      }
    ]
  }
}
```

## Segurança

### Hardening

```json
{
  "security": {
    "headers": {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy": "default-src 'self'"
    },
    "encryption": {
      "atRest": true,
      "inTransit": true,
      "algorithm": "AES-256-GCM"
    },
    "authentication": {
      "type": "jwt",
      "algorithm": "RS256",
      "expiresIn": "24h",
      "refreshToken": {
        "enabled": true,
        "expiresIn": "7d"
      }
    }
  }
}
```

## Troubleshooting

### Problemas Comuns

#### Erros de Compilação

```bash
# Verificar sintaxe
jade lint --fix

# Analisar dependências
jade analyze --dependencies

# Verificar tipos
jade type-check
```

#### Problemas de Performance

```bash
# Analisar bundle
jade build --analyze

# Profile de execução
jade run --profile

# Análise de memória
jade run --memory-profile
```

#### Problemas de Deploy

```bash
# Verificar configuração
jade config validate

# Testar localmente
jade build --production && jade serve

# Verificar artefatos
jade package --list
```

## Boas Práticas

### Organização de Configuração

1. **Separar ambientes**: Use arquivos diferentes para dev/staging/prod
2. **Variáveis de ambiente**: Nunca commitar segredos
3. **Documentação**: Mantenha configurações documentadas
4. **Versionamento**: Versione suas configurações

### Performance

1. **Otimizações**: Use `--optimize` em produção
2. **Bundle size**: Monitore tamanho dos artefatos
3. **Caching**: Configure cache adequado
4. **CDN**: Use CDN para assets estáticos

### Segurança

1. **Segredos**: Use variáveis de ambiente
2. **HTTPS**: Sempre use em produção
3. **Headers**: Configure headers de segurança
4. **Atualizações**: Mantenha dependências atualizadas

Este guia cobre os principais aspectos de configuração e deploy de aplicações JADE, desde desenvolvimento até produção.
