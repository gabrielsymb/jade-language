# Criptografia

O `Crypto` oferece funções para hash, criptografia e assinaturas digitais.

## Hash de senhas

```jd
// Nunca salve senha em texto puro
senhaHash = Crypto.hash(senha, "sha256")

usuario = Usuario()
usuario.senhaHash = senhaHash
salvar usuario
```

## Verificar senha no login

```jd
funcao autenticar(email: texto, senha: texto) -> booleano
  usuarios = EntityManager.buscar(Usuario)
  usuario = usuarios.obter(0)

  se nao usuario
    retornar falso
  fim

  hashDigitado = Crypto.hash(senha, "sha256")
  retornar hashDigitado == usuario.senhaHash
fim
```

## Criptografar dados sensíveis

```jd
funcao criptografarDados(dadosSensiveis: texto) -> texto
  variavel chave = Session.get("encryption_key")

  // Criptografar
  dadosCriptografados = Crypto.encrypt(dadosSensiveis, chave)

  // Descriptografar
  original = Crypto.decrypt(dadosCriptografados, chave)
  retornar dadosCriptografados
fim
```

## Geração de chaves seguras

```jd
// Par de chaves RSA
parChaves = Crypto.generateKeyPair("rsa")
chavePublica = parChaves.public
chavePrivada = parChaves.private

// Derivar chave de senha (mais seguro que hash simples)
salt = Crypto.randomBytes(16)
chave = Crypto.deriveKey("senha_do_usuario", salt, 100000)
```

## Assinatura digital

```jd
// Assinar documento
assinatura = Crypto.sign(documentoJSON, chavePrivada)

// Verificar assinatura
valido = Crypto.verify(documentoJSON, assinatura, chavePublica)

se valido
  Console.escrever("Documento autêntico")
senao
  Console.escrever("Assinatura inválida!")
fim
```

## Próximo passo

→ [Console](/runtime/console)
