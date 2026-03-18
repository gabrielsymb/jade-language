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
  usuario = EntityManager.findAll(Usuario, { onde: { email: email } }).obter(0)

  se nao usuario
    retornar falso
  fim

  hashDigitado = Crypto.hash(senha, "sha256")
  retornar hashDigitado == usuario.senhaHash
fim
```

## Criptografar dados sensíveis

```jd
chave = Session.get("encryption_key")

// Criptografar
dadosCriptografados = Crypto.encrypt(dadosSensiveis, chave)
salvar dadosCriptografados no banco

// Descriptografar
original = Crypto.decrypt(dadosCriptografados, chave)
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
  Console.log("Documento autêntico")
senao
  Console.log("Assinatura inválida!")
fim
```

## Próximo passo

→ [Console](/runtime/console)
