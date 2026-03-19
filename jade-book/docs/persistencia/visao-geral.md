# Como o JADE salva dados

Esta é uma das partes mais únicas do JADE. Esqueça SQL, esqueça configurar conexão com banco, esqueça migrations — o JADE usa um modelo **offline-first** que funciona sem servidor.

## O modelo offline-first

```
Você escreve código JADE
        ↓
Runtime salva no IndexedDB (banco local do browser)
        ↓
SyncManager envia para o servidor quando há conexão
        ↓
Servidor persiste em PostgreSQL / MySQL / SQLite
```

O seu código só fala com o **runtime local**. A sincronização com servidor acontece por baixo dos panos, automaticamente.

## Por que offline-first?

- **Funciona sem internet** — o usuário trabalha normalmente, os dados sincronizam depois
- **Sem loading para leituras** — dados locais são instantâneos
- **Resiliência** — quedas de conexão não travam o sistema
- **PWA nativo** — funciona instalado no celular como app

## Salvando dados

Use `salvar` seguido da entidade:

```jd
produto = Produto()
produto.nome = "Notebook"
produto.preco = 3500.00
produto.estoque = 10
produto.ativo = verdadeiro

salvar produto
// Salvo localmente. Sincroniza com servidor em background.
```

## Buscando dados

### Buscar por ID

```jd
produto = EntityManager.buscarPorId(Produto, produtoId)

se nao produto
  Console.escrever("Produto não encontrado")
fim
```

### Buscar todos

```jd
todos = EntityManager.buscar(Produto)
```

### Buscar com filtros

```jd
ativos = EntityManager.buscar(Produto, {
  onde: { ativo: verdadeiro },
  ordenarPor: { nome: "asc" },
  limite: 20
})
```

### Contar

```jd
total = EntityManager.contar(Produto)
Console.escrever("Total de produtos: " + total)
```

## Atualizando dados

```jd
produto = EntityManager.buscarPorId(Produto, id)
produto.preco = 4000.00
salvar produto
```

## Excluindo dados

Em JADE, a exclusão é sempre **lógica** — o registro é desativado, não apagado:

```jd
produto = EntityManager.buscarPorId(Produto, id)
produto.ativo = falso
salvar produto
```

Para exclusão física (use com cuidado):

```jd
EntityManager.remover(produto)
```

## Controle de versão automático

Cada registro tem um campo `_rev` gerado automaticamente:

```
Produto {
  id:      "abc-123"
  _rev:    "3-f8a2b"   ← versão 3 deste registro
  nome:    "Notebook"
  preco:   3500.00
}
```

Isso permite ao sistema detectar conflitos quando dois dispositivos offline modificam o mesmo registro.

## Conflitos e resolução

Quando dois usuários offline modificam o mesmo dado, o sistema resolve automaticamente usando **delta merging**:

- Se modificaram **campos diferentes** → merge automático
- Se modificaram o **mesmo campo** → ganha o último (last-write-wins)
- Para casos críticos → conflito registrado para revisão humana

```jd
// Dispositivo A (offline) alterou: preco: 3000 → 3500
// Dispositivo B (offline) alterou: estoque: 10 → 8

// Quando ambos sincronizam:
// Resultado: preco = 3500, estoque = 8 (merge automático!)
```

## Próximo passo

→ [EntityManager](/persistencia/entity-manager)
