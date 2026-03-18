---
name: JADE Language Project Status
description: Status do projeto JADE DSL — compilador e runtime para sistemas empresariais
type: project
---

Projeto JADE é um DSL empresarial com sintaxe em português, localizado em /home/yakuzaa/Documentos/Projetos/hyper.

**Estrutura**: monorepo npm workspaces com jade-compiler e jade-runtime.

**Status técnico** (2026-03-18):
- Compilador: Lexer → Parser → AST → Type Checker → IR → WAT → WASM — tudo funcionando
- Runtime: EventLoop, MemoryManager, APIs (HTTP/auth/auditoria), UI Engine, PWA — funcionando
- 72 testes Vitest no compilador + 30 no runtime, todos passando

**Why:** DLS enterprise competindo com grandes players no mercado brasileiro. Sintaxe em português, tipagem estática, compilação para WebAssembly.

**How to apply:** Ao sugerir features, priorizar completude do CLI `jadec`, LSP para IDE, e migração dos testes legados .js para Vitest formal.
