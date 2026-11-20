# Arquitetura inicial

## Decisões

A aplicação começa como um **monólito modular** em Next.js, preservando limites de domínio e transações simples sem o custo prematuro de microsserviços.

```text
App Router (UI, Route Handlers, Server Actions)
                    |
          application/use-cases
                    |
 domains/* <---- ports/interfaces ----> infrastructure/*
                    |
       DAL server-only + Prisma/PostgreSQL
```

- `src/app`: composição de telas e adaptadores HTTP; não contém regra de negócio ou Prisma.
- `src/domains/<domain>`: entidades, políticas, schemas Zod e casos de uso.
- `src/server/auth`: Auth.js e identidade; `src/server/dal`: consultas autorizadas e DTOs mínimos.
- `src/server/db`: Prisma e persistência; `src/shared`: tipos/utilitários sem domínio.
- `prisma`: modelo persistente, migrações e seed de demonstração.

| Domínio | Responsabilidade | Não deve conhecer |
| --- | --- | --- |
| Identity & Access | identidade, sessão, papéis e políticas | planejamento e progresso |
| Personal Organization | áreas e objetivos | execução de tarefas |
| Catalog | órgãos, concursos, cargos, editais e taxonomia | progresso privado |
| Learning Library | materiais, arquivos, autoria, licença e versões | cronogramas |
| Question Bank | questões, alternativas, assuntos e procedência | sessão de autenticação |
| Planning | disponibilidade, regras, planos e tarefas | métricas agregadas |
| Learning Records | sessões, tentativas, revisões e erros | plano mutável |
| AI & Ingestion | extração, grounding, geração e revisão | publicação direta |

## Modelo e invariantes

- `Objective` independe de concurso e pode referenciar zero ou vários editais.
- `Subject`/`Topic` são reutilizáveis; `ObjectiveSubject` permite compartilhar disciplinas sem duplicação.
- A hierarquia usa `Topic.parentId`. Ciclos e pai/filho na mesma disciplina exigem validação e trigger.
- Editais, materiais e regras de plano são versionados; versão publicada é imutável.
- `StudySession` e `QuestionAttempt` são fatos históricos independentes do cronograma mutável.
- `manualLock` preserva edição humana; `generationKey` dá idempotência; `supersedesId` registra reprogramação.
- Conteúdo importado/IA começa em rascunho ou revisão e requer curadoria para publicação.
- Prioridade 1–5 e intervalos de disponibilidade terão `CHECK`s na primeira migração.

## Autorização

Auth.js resolve a sessão; a DAL recebe o ator derivado dela, nunca do corpo; cada consulta privada inclui `ownerId`, `userId` ou associação. Buscar só pelo ID e verificar depois não é aceito.

| Recurso | Leitura | Escrita | Publicação |
| --- | --- | --- | --- |
| Área pessoal | proprietário | proprietário | n/a |
| Objetivo | owner/editor/viewer | owner/editor | n/a |
| Plano e progresso | proprietário | proprietário | n/a |
| Material/questão privada | autor/permissão | autor | curador/admin |
| Catálogo e edital | publicado ou curador | curador/admin | curador/admin |

Administração terá casos de uso e auditoria próprios. RLS será defesa adicional, não substituto das policies.

## API proposta

Route Handlers ficam em `/api/v1`; Server Actions adaptam os mesmos casos de uso, sem Prisma direto.

| Método e rota | Regra principal |
| --- | --- |
| `GET/POST /api/v1/study-areas` | escopo da sessão |
| `PATCH/DELETE /api/v1/study-areas/:id` | owner; arquiva com histórico |
| `GET/POST /api/v1/objectives` | tipo/área visíveis ao ator |
| `GET/PATCH /api/v1/objectives/:id` | viewer lê, editor edita |
| `POST /api/v1/objectives/:id/archive` | owner/editor; idempotente |
| `GET /api/v1/catalog/subjects` | publicados, salvo curadoria |
| `POST /api/v1/notices/:id/versions` | curador cria rascunho |
| `POST /api/v1/notice-versions/:id/review` | transição validada |
| `GET/POST /api/v1/study-plans` | owner e objetivos acessíveis |
| `POST /api/v1/study-plans/:id/generate` | idempotente/versionado |
| `POST /api/v1/question-attempts` | correção no servidor |

Erros usam `application/problem+json`; listas usam cursor e limite; escritas relevantes aceitam idempotency key.

## Riscos

| Risco | Impacto | Mitigação |
| --- | --- | --- |
| vazamento multiusuário | crítico | DAL, escopo na query, testes negativos e RLS |
| taxonomia divergente | alto | catálogo canônico, aliases e curadoria |
| extração incorreta | alto | evidência, confiança e revisão humana |
| conteúdo sem licença | crítico | procedência/licença e bloqueio de publicação |
| replanejamento destrutivo | alto | locks, idempotência e linhagem |
| métricas acopladas ao plano | alto | fatos imutáveis independentes |
| ciclos na hierarquia | médio | validação transacional e trigger |
| datas/fusos | alto | UTC, timezone IANA e datas civis `date` |
| custo/latência de IA | médio | jobs, limites, cache e modelo configurável |

## Trilha Fiscal

Não há implementação da Trilha Fiscal neste repositório ou histórico (somente Create Next App). Nenhum componente foi copiado. Planos, disciplinas, assuntos, questões e progresso foram generalizados sem dependência de concurso, órgão ou banca.
