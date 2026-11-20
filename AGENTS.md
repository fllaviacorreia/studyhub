<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Convenções do StudyHub

- Trabalhe em branch de funcionalidade; não altere diretamente `main`.
- Leia o guia correspondente em `node_modules/next/dist/docs/` antes de alterar Next.js.
- UI/documentação de produto em pt-BR; identificadores em inglês.
- Preserve `docs/architecture.md`: `src/app` adapta HTTP/UI e não contém regra ou Prisma.
- Dados privados passam pela DAL `server-only`, com ator da sessão e escopo na consulta.
- Não aceite `userId`/`ownerId` do cliente como identidade nem trate UI como autorização.
- Catálogo global e dados privados são separados; SEFAZ-BA e ANPD são demonstração.
- Conteúdo importado/IA exige procedência e revisão antes de publicar.
- Fatos de progresso independem do plano mutável.
- Schema exige migração, constraints, `prisma validate` e testes de isolamento.
- Segredos são backend-only, nunca `NEXT_PUBLIC_`.
- Execute `npm run check` e atualize a documentação antes do handoff.
