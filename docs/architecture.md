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

| Domínio               | Responsabilidade                                | Não deve conhecer        |
| --------------------- | ----------------------------------------------- | ------------------------ |
| Identity & Access     | identidade, sessão, papéis e políticas          | planejamento e progresso |
| Personal Organization | áreas e objetivos                               | execução de tarefas      |
| Catalog               | órgãos, concursos, cargos, editais e taxonomia  | progresso privado        |
| Learning Library      | materiais, arquivos, autoria, licença e versões | cronogramas              |
| Question Bank         | questões, alternativas, assuntos e procedência  | sessão de autenticação   |
| Planning              | disponibilidade, regras, planos e tarefas       | métricas agregadas       |
| Learning Records      | sessões, tentativas, revisões e erros           | plano mutável            |
| Assessment            | simulados, seleção e estratégias de pontuação   | autenticação e UI        |
| AI & Ingestion        | extração, grounding, geração e revisão          | publicação direta        |

## Modelo e invariantes

- `Objective` independe de concurso e pode referenciar zero ou vários editais.
- `Subject`/`Topic` são reutilizáveis; `ObjectiveSubject` permite compartilhar disciplinas sem duplicação.
- A hierarquia usa `Topic.parentId`. Ciclos e pai/filho na mesma disciplina exigem validação e trigger.
- Editais, materiais e regras de plano são versionados; versão publicada é imutável.
- `StudySession` e `QuestionAttempt` são fatos históricos independentes do cronograma mutável.
- `manualLock` preserva edição humana; `generationKey` dá idempotência; `supersedesId` registra reprogramação.
- Conteúdo importado/IA começa em rascunho ou revisão e requer curadoria para publicação.
- Prioridade 1–5 e intervalos de disponibilidade terão `CHECK`s na primeira migração.
- Áreas possuem estado explícito `ACTIVE`/`ARCHIVED`; objetivos preservam quatro estados. Arquivar mantém vínculos e restaura o estado operacional sem apagar histórico.
- Exclusão física de área é bloqueada quando existem objetivos vinculados. Objetivos com planos ou sessões também não são removidos fisicamente.
- O vínculo opcional `Objective.examinationId` e `ObjectivePosition` seleciona concurso, cargos e especialidades sem transformar o catálogo global em dado do usuário.
- Editais preservam retificações por identidade (`originalNoticeId`) e versões documentais ordenadas; conteúdos programáticos preservam a árvore original antes da classificação taxonômica.

## Autorização

Auth.js resolve a sessão; nesta fundação, cadastro local usa credenciais com hash BCrypt e sessão JWT em cookie seguro. A DAL recebe o ator derivado da sessão, nunca do corpo; cada consulta privada inclui `ownerId`, `userId` ou associação. Buscar só pelo ID e verificar depois não é aceito. O modelo de contas e sessões persistidas permanece disponível para provedores futuros, sem habilitá-los prematuramente.

| Recurso                  | Leitura              | Escrita       | Publicação    |
| ------------------------ | -------------------- | ------------- | ------------- |
| Área pessoal             | proprietário         | proprietário  | n/a           |
| Objetivo                 | owner/editor/viewer  | owner/editor  | n/a           |
| Plano e progresso        | proprietário         | proprietário  | n/a           |
| Material/questão privada | autor/permissão      | autor         | curador/admin |
| Catálogo e edital        | publicado ou curador | curador/admin | curador/admin |

Administração terá casos de uso e auditoria próprios. RLS será defesa adicional, não substituto das policies.

## API proposta

Route Handlers ficam em `/api/v1`; Server Actions adaptam os mesmos casos de uso, sem Prisma direto.

| Método e rota                              | Regra principal                                                   |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `GET/POST /api/v1/study-areas`             | escopo da sessão                                                  |
| `PATCH/DELETE /api/v1/study-areas/:id`     | owner; arquiva com histórico                                      |
| `GET/POST /api/v1/study-goals`             | objetivos do proprietário; área validada no mesmo escopo          |
| `GET/PATCH/DELETE /api/v1/study-goals/:id` | proprietário; exclusão preserva dependências históricas           |
| `POST /api/v1/objectives/:id/archive`      | owner/editor; idempotente                                         |
| `GET /api/v1/catalog/subjects`             | publicados, salvo curadoria                                       |
| `GET /api/v1/examinations`                 | catálogo publicado, com busca, filtros e cursor                   |
| `PUT /api/v1/study-goals/:id/catalog`      | proprietário; valida concurso, cargo e especialidade em transação |
| `POST /api/v1/notices/:id/versions`        | curador cria rascunho                                             |
| `POST /api/v1/notice-versions/:id/review`  | transição validada                                                |
| `GET/POST /api/v1/study-plans`             | owner e objetivos acessíveis                                      |
| `POST /api/v1/study-plans/:id/generate`    | idempotente/versionado                                            |
| `POST /api/v1/question-attempts`           | correção no servidor                                              |

Erros usam `application/problem+json`; listas usam cursor e limite; escritas relevantes aceitam idempotency key.

## Riscos

| Risco                       | Impacto | Mitigação                                    |
| --------------------------- | ------- | -------------------------------------------- |
| vazamento multiusuário      | crítico | DAL, escopo na query, testes negativos e RLS |
| taxonomia divergente        | alto    | catálogo canônico, aliases e curadoria       |
| extração incorreta          | alto    | evidência, confiança e revisão humana        |
| conteúdo sem licença        | crítico | procedência/licença e bloqueio de publicação |
| replanejamento destrutivo   | alto    | locks, idempotência e linhagem               |
| métricas acopladas ao plano | alto    | fatos imutáveis independentes                |
| ciclos na hierarquia        | médio   | validação transacional e trigger             |
| datas/fusos                 | alto    | UTC, timezone IANA e datas civis `date`      |
| custo/latência de IA        | médio   | jobs, limites, cache e modelo configurável   |

## Trilha Fiscal

Não há implementação da Trilha Fiscal neste repositório ou histórico (somente Create Next App). Nenhum componente foi copiado. Planos, disciplinas, assuntos, questões e progresso foram generalizados sem dependência de concurso, órgão ou banca.

## Planejamento implementado

O motor de planejamento é um serviço puro em `src/domains/planning`, separado de HTTP e Prisma. A DAL privada aplica escopo do proprietário em todas as consultas. Geração e replanejamento usam prévias persistidas, versão otimista, validade de 30 minutos, chaves idempotentes e revisões transacionais. Detalhes e regras estão em [planning.md](planning.md).

## Biblioteca e aprendizagem implementadas

A biblioteca e o banco objetivo reutilizam os esboços `Material` e `Question` da fundação. Publicações mantêm versões imutáveis, sessões fixam ordem e versão, e tentativas são fatos históricos privados. A correção é determinística em `src/domains/learning`; HTTP apenas adapta casos de uso e a DAL `server-only` aplica escopo. O tempo permanece exclusivamente em `StudySession`. Regras e endpoints estão em [learning.md](learning.md).

## Revisões e simulados implementados

Agendamentos são deduplicados por usuário e assunto, avaliações formam histórico imutável e o caderno de erros acompanha questões sem substituir tentativas. Simulados reutilizam sessões, versões e correção do banco de questões, acrescentando configuração, prazo e snapshot de pontuação. Tarefas podem referenciar revisões e simulados sem duplicar tempo. Regras e endpoints estão em [reviews-and-mock-exams.md](reviews-and-mock-exams.md).

## Tutor inteligente implementado

O tutor usa uma porta `AIProvider` e um adaptador servidor para a OpenAI Responses API. Conversas, fontes, consumo, gerações e recomendações pertencem ao usuário e passam pela DAL. A recuperação consulta somente materiais publicados compartilhados/públicos ou do próprio autor; indicadores continuam calculados pelos módulos determinísticos. Detalhes, limites e política de dados estão em [ai-study-assistant.md](ai-study-assistant.md).
