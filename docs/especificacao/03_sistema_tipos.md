# Sistema de Tipos JADE

## Tipos Primitivos

JADE possui os seguintes tipos primitivos:

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `texto` | Sequência de caracteres | `"João Silva"` |
| `numero` | Número inteiro | `42` |
| `decimal` | Número decimal | `123.45` |
| `booleano` | Verdadeiro ou falso | `verdadeiro` / `falso` |
| `data` | Data (dia, mês, ano) | `2024-03-15` |
| `hora` | Hora (hora, minuto) | `14:30` |
| `id` | Identificador único (UUID) | `123e4567-e89b-12d3-a456-426614174000` |

## Declaração de Variáveis

Variáveis são declaradas com a palavra-chave `variavel`:

```jade
variavel nome: texto
variavel saldo: decimal
variavel quantidade: numero
variavel ativo: booleano
variavel criadoEm: data
```

## Tipos Compostos

### Lista
Coleção ordenada de elementos do mesmo tipo:

```jade
variavel produtos: lista<Produto>
variavel numeros: lista<numero>
```

### Mapa
Coleção de pares chave-valor:

```jade
variavel config: mapa<texto, texto>
variavel precos: mapa<texto, decimal>
```

### Objeto
Estrutura com campos específicos:

```jade
variavel endereco: objeto {
    rua: texto,
    numero: numero,
    cidade: texto,
    cep: texto
}
```

## Tipos Personalizados

Além dos tipos primitivos, você pode usar classes e entidades como tipos:

```jade
classe Produto
    nome: texto
    preco: decimal
    estoque: numero
fim

variavel produto: Produto
```

## Verificação de Tipos

JADE possui tipagem estática. Os tipos são verificados em tempo de compilação, o que ajuda a evitar erros comuns:

```jade
// Válido
variavel soma: numero = 10 + 5

// Erro de compilação
variavel texto: texto = 10 + 5  // numero + numero não pode ser atribuído a texto
```

## Conversão de Tipos

Conversões explícitas podem ser realizadas:

```jade
variavel textoNumero: texto = "123"
variavel numeroConvertido: numero = converter<numero>(textoNumero)
```

## Inferência de Tipos

Em alguns casos, o compilador pode inferir o tipo:

```jade
variavel nome = "João"  // Inferido como texto
variavel idade = 30     // Inferido como numero
```

## Tipos Nulos

Variáveis podem ser nulas por padrão. Para declarar como não nula:

```jade
variavel nomeObrigatorio: texto!  // Não pode ser nulo
variavel nomeOpcional: texto?    // Pode ser nulo
```
