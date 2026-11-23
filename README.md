# StudyHub

Plataforma multiusuário para organizar áreas, objetivos, catálogo e planos de estudo. O módulo de planejamento oferece disponibilidade semanal, assuntos compartilhados, geração determinística, prévia/versionamento, replanejamento protegido, agenda, sessões e indicadores. Consulte [docs/planning.md](docs/planning.md).

Plataforma web multiusuário e multiobjetivo para organizar estudos, editais, conteúdos, questões, planejamento e evolução. SEFAZ-BA e ANPD são apenas exemplos de uso.

O projeto possui fundação funcional com PostgreSQL, Prisma e autenticação local via Auth.js, gerenciamento privado de áreas e objetivos e um catálogo compartilhado de concursos, editais e conteúdos programáticos. Consulte [a arquitetura](docs/architecture.md), [o catálogo](docs/catalog.md) e [o plano incremental](docs/implementation-plan.md).

## Desenvolvimento

Requisitos: Node.js 20+, npm e Docker com Compose.

Copie `.env.example` para `.env`, substitua `AUTH_SECRET` por um segredo aleatório e prepare o ambiente:

```bash
docker compose up -d postgres adminer
npm install
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

A aplicação estará em `http://localhost:3000`. O health check do banco está em `GET /api/v1/health`.

O Adminer estará disponível em `http://localhost:8081` por padrão. Para acessar o banco local, use sistema `PostgreSQL`, servidor `postgres`, usuário e senha `studyhub` e banco `studyhub`. A porta pode ser alterada com `ADMINER_PORT`; essas credenciais são exclusivas do ambiente de desenvolvimento.

Após entrar, use `/app/areas`, `/app/objetivos` e `/app/concursos`. A API privada continua sob `/api/v1/study-areas` e `/api/v1/study-goals`; a referência do catálogo está em [docs/catalog.md](docs/catalog.md).

## Variáveis de ambiente

| Variável       | Uso                                          | Exposição |
| -------------- | -------------------------------------------- | --------- |
| `DATABASE_URL` | conexão PostgreSQL usada somente pelo Prisma | backend   |
| `ADMINER_PORT` | porta local opcional do Adminer (padrão 8081) | local     |
| `AUTH_SECRET`  | assinatura e criptografia da sessão Auth.js  | backend   |

Nenhuma variável desta entrega usa o prefixo `NEXT_PUBLIC_`.

## Banco e migrations

```bash
npm run db:validate         # valida o schema
npm run db:migrate          # cria/aplica migrations no desenvolvimento
npm run db:migrate:deploy   # aplica migrations existentes
npm run db:seed             # dados fictícios e idempotentes de desenvolvimento
```

Validação local:

```bash
npm run check
```

O comando executa validação do Prisma, lint, typecheck, testes e build de produção.
