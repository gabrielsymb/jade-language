# Texto e String

O tipo `texto` tem uma biblioteca completa de métodos — incluindo utilitários específicos para o contexto brasileiro.

## Métodos básicos

```jd
variavel frase = "  Olá, Mundo!  "

Console.escrever(frase.tamanho())      // 15
Console.escrever(frase.aparar())       // "Olá, Mundo!"
Console.escrever(frase.maiusculo())    // "  OLÁ, MUNDO!  "
Console.escrever(frase.minusculo())    // "  olá, mundo!  "
```

## Busca e verificação

```jd
variavel email = "usuario@empresa.com.br"

Console.escrever(email.contem("@"))              // verdadeiro
Console.escrever(email.comecaCom("usuario"))     // verdadeiro
Console.escrever(email.terminaCom(".br"))        // verdadeiro
Console.escrever(email.tamanho())               // 22
```

## Transformação

```jd
variavel url = "meu produto bonito"

// Substituir espaços por hífen (slug de URL)
slug = url.substituir(" ", "-").minusculo()
Console.escrever(slug)  // "meu-produto-bonito"

// Dividir em partes
variavel csv = "Ana,Bruno,Carlos,Diana"
nomes = csv.dividir(",")

para nome em nomes
  Console.escrever(nome)
fim
// Ana
// Bruno
// Carlos
// Diana
```

## Normalização Unicode

```jd
variavel texto_digitado = "São Paulo"
normalizado = texto_digitado.normalizar()  // NFC Unicode
```

## Validações brasileiras

Jade DSL inclui validadores específicos para o contexto brasileiro:

```jd
variavel cpf = "123.456.789-09"
variavel cnpj = "12.345.678/0001-95"
variavel cep = "01310100"
variavel telefone = "11987654321"

Console.escrever(cpf.validarCPF())          // booleano
Console.escrever(cnpj.validarCNPJ())        // booleano
Console.escrever(cep.formatarCEP())         // "01310-100"
Console.escrever(telefone.formatarTelefone()) // "(11) 98765-4321"
```

### Usando em validação de formulário

```jd
funcao validarCadastro(cpf: texto, email: texto, cep: texto) -> lista<texto>
  erros: lista<texto> = lista()

  se nao cpf.validarCPF()
    erros.adicionar("CPF inválido")
  fim

  se nao email.contem("@") ou nao email.contem(".")
    erros.adicionar("Email inválido")
  fim

  cepLimpo = cep.substituir("-", "").aparar()
  se cepLimpo.tamanho() != 8
    erros.adicionar("CEP inválido")
  fim

  retornar erros
fim
```

## Concatenação avançada

```jd
funcao gerarResumo(pedido: Pedido, cliente: Cliente) -> texto
  linhas: lista<texto> = lista()

  linhas.adicionar("=== RESUMO DO PEDIDO ===")
  linhas.adicionar("Pedido:  " + pedido.id)
  linhas.adicionar("Cliente: " + cliente.nome)
  linhas.adicionar("Data:    " + pedido.dataPedido)
  linhas.adicionar("Total:   R$ " + pedido.valorTotal)
  linhas.adicionar("Status:  " + pedido.status)

  // Juntar com quebra de linha
  resultado = ""
  para linha em linhas
    resultado = resultado + linha + "\n"
  fim
  retornar resultado
fim
```

## Referência completa dos métodos

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `tamanho()` | `numero` | Número de caracteres |
| `aparar()` | `texto` | Remove espaços das bordas |
| `maiusculo()` | `texto` | Converte para maiúsculas |
| `minusculo()` | `texto` | Converte para minúsculas |
| `contem(busca)` | `booleano` | Verifica se contém a substring |
| `comecaCom(prefixo)` | `booleano` | Verifica o início |
| `terminaCom(sufixo)` | `booleano` | Verifica o fim |
| `substituir(de, para)` | `texto` | Substitui ocorrências |
| `dividir(delimitador)` | `lista<texto>` | Divide em partes |
| `normalizar()` | `texto` | Normalização Unicode NFC |
| `validarCPF()` | `booleano` | Valida CPF brasileiro |
| `validarCNPJ()` | `booleano` | Valida CNPJ brasileiro |
| `formatarCEP()` | `texto` | Formata como CEP (XXXXX-XXX) |
| `formatarTelefone()` | `texto` | Formata como telefone BR |

## Próximo passo

→ [Como a Jade DSL salva dados](/persistencia/visao-geral)
