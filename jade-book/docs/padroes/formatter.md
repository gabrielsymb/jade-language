# Formatter — Formatação Automática

O JADE inclui um formatter embutido que padroniza o estilo do código automaticamente, sem alterar o comportamento do programa.

## Como usar

### Via CLI

```bash
# Exibe o código formatado no terminal (não altera o arquivo)
jadec programa.jd --format

# Formata e sobrescreve o arquivo
jadec programa.jd --format-write
```

### Via VS Code

Com a extensão JADE instalada, o formatter é executado automaticamente ao salvar o arquivo (`Format on Save`). Você também pode invocar manualmente com `Shift+Alt+F` (ou `Cmd+Shift+F` no macOS).

::: tip Seguro por design
Se o arquivo contiver erros de sintaxe, o formatter não faz nada — nunca corrompe seu código.
:::

## Regras de formatação

### Indentação

O formatter usa **2 espaços** de indentação em todos os blocos:

```jd
servico estoqueService
  funcao calcularValor(preco: decimal, qtd: numero) -> decimal
    retornar preco * qtd
  fim
fim
```

### Linha em branco entre declarações

Uma linha em branco separa declarações de nível superior:

```jd
entidade Produto
  id: id
  nome: texto
fim

entidade Categoria
  id: id
  nome: texto
fim

servico estoqueService
  funcao listar() -> lista<Produto>
    retornar listarTodos()
  fim
fim
```

### Importações agrupadas no topo

As importações são sempre movidas para o início do arquivo:

```jd
importar modelos.Produto
importar modelos.Categoria

servico estoqueService
  ...
fim
```

### Espaçamento em operadores

Sempre um espaço antes e depois de operadores:

```jd
// ✅ Formatado
variavel total = preco * quantidade + frete

// ❌ Antes de formatar
variavel total=preco*quantidade+frete
```

### Expressões binárias aninhadas

Subexpressões binárias recebem parênteses para deixar a precedência explícita:

```jd
// Entrada
variavel resultado = a + b * c

// Saída
variavel resultado = a + (b * c)
```

### Quebra de linha ao final

O arquivo sempre termina com exatamente uma quebra de linha.

## Idempotência

Formatar um arquivo já formatado não altera nada — é seguro executar `--format-write` múltiplas vezes ou integrar ao CI:

```bash
# Verificar se todos os arquivos estão formatados
for f in **/*.jd; do
  jadec "$f" --format | diff - "$f" || echo "Não formatado: $f"
done
```

## Próximo passo

→ [Linter — Avisos de Estilo](/padroes/linter)
