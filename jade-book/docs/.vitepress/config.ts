import { defineConfig } from 'vitepress'


export default defineConfig({
  title: 'Jade DSL',
  description: 'O guia completo da Jade DSL — linguagem empresarial em português compilada para WebAssembly',
  lang: 'pt-BR',
  base: '/jade-language/',

  themeConfig: {
    logo: '/icon-file.svg',
    siteTitle: 'Jade DSL',

    nav: [
      { text: 'Início', link: '/' },
      { text: 'Guia', link: '/introducao/o-que-e-jade' },
      { text: 'Referência', link: '/estruturas/entidades' },
      { text: 'Vitrine', link: '/vitrine' },
    ],

    sidebar: [
      {
        text: '📖 Introdução',
        items: [
          { text: 'O que é Jade DSL?', link: '/introducao/o-que-e-jade' },
          { text: 'Instalação e Configuração', link: '/introducao/instalacao' },
          { text: 'Olá, Mundo!', link: '/introducao/ola-mundo' },
        ],
      },
      {
        text: '🧱 Fundamentos',
        items: [
          { text: 'Tipos e Variáveis', link: '/fundamentos/tipos-e-variaveis' },
          { text: 'Operadores', link: '/fundamentos/operadores' },
          { text: 'Controle de Fluxo', link: '/fundamentos/controle-de-fluxo' },
          { text: 'Funções', link: '/fundamentos/funcoes' },
        ],
      },
      {
        text: '🏗️ Estruturas da Linguagem',
        items: [
          { text: 'Entidades', link: '/estruturas/entidades' },
          { text: 'Classes', link: '/estruturas/classes' },
          { text: 'Serviços', link: '/estruturas/servicos' },
          { text: 'Eventos', link: '/estruturas/eventos' },
          { text: 'Regras de Negócio', link: '/estruturas/regras' },
          { text: 'Interfaces', link: '/estruturas/interfaces' },
          { text: 'Enumerações', link: '/estruturas/enums' },
          { text: 'Módulos e Importações', link: '/estruturas/modulos' },
        ],
      },
      {
        text: '📦 Coleções e Texto',
        items: [
          { text: 'Listas', link: '/colecoes/listas' },
          { text: 'Mapas', link: '/colecoes/mapas' },
          { text: 'Texto e String', link: '/colecoes/texto' },
        ],
      },
      {
        text: '💾 Persistência',
        items: [
          { text: 'Como a Jade DSL salva dados', link: '/persistencia/visao-geral' },
          { text: 'Banco de Dados (banco)', link: '/persistencia/banco' },
          { text: 'EntityManager', link: '/persistencia/entity-manager' },
          { text: 'Sincronização Offline', link: '/persistencia/offline-sync' },
          { text: 'Protocolo de Sincronização', link: '/persistencia/protocolo-sync' },
        ],
      },
      {
        text: '🔌 Runtime e APIs',
        items: [
          { text: 'HTTP e Redes', link: '/runtime/http' },
          { text: 'Autenticação', link: '/runtime/autenticacao' },
          { text: 'Data e Hora', link: '/runtime/datetime' },
          { text: 'Criptografia', link: '/runtime/crypto' },
          { text: 'Console', link: '/runtime/console' },
          { text: 'Matemática e Estatística', link: '/runtime/matematica' },
          { text: 'Moeda e Financeiro', link: '/runtime/moeda' },
          { text: 'XML e NF-e', link: '/runtime/xml' },
        ],
      },
      {
        text: '🖥️ Interface de Usuário',
        items: [
          { text: 'Telas (tela)', link: '/ui/tela' },
        ],
      },
      {
        text: '💡 Padrões e Boas Práticas',
        items: [
          { text: 'Padrões de Design', link: '/padroes/design' },
          { text: 'Formatter', link: '/padroes/formatter' },
          { text: 'Linter', link: '/padroes/linter' },
          { text: 'Erros Comuns', link: '/padroes/erros-comuns' },
        ],
      },
      {
        text: '🚀 Projeto Completo',
        items: [
          { text: 'Sistema de Estoque', link: '/projeto/sistema-estoque' },
        ],
      },
      {
        text: '🎯 Vitrine',
        items: [
          { text: 'ERP/WMS em Jade DSL', link: '/vitrine' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/gabrielsymb/jade-language' },
    ],

    footer: {
      message: 'Feito com ❤️ para desenvolvedores brasileiros.',
      copyright: 'Jade DSL — Licença MIT',
    },

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/jade-lang/jade-book/edit/main/docs/:path',
      text: 'Editar esta página',
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
    languageAlias: {
      jd: 'js',
    },
    config: (md) => {
      // Escape bare HTML tags in inline text (e.g. lista<Produto>, mapa<texto>)
      // to prevent Vue template compiler from treating them as unclosed HTML elements.
      md.core.ruler.push('escape-html-inline', (state) => {
        for (const blockToken of state.tokens) {
          if (!blockToken.children) continue
          for (const token of blockToken.children) {
            if (token.type === 'html_inline') {
              token.type = 'text'
              token.content = token.content
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
            }
          }
        }
      })
    },
  },
})
