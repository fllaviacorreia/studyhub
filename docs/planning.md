# Motor de planos de estudo

## Modelo e armazenamento temporal

O plano pertence a um usuário e referencia objetivos do mesmo proprietário. `StudyPlanTopic` é a unidade deduplicada: aponta para `Topic`, `SyllabusItem` ou para uma referência manual estruturada (`customTitle` + `customSubject`) e mantém os objetivos beneficiados em N:N. Sessões são fatos históricos e não são apagadas durante o replanejamento.

Datas do calendário (`startDate`, `endDate`, `scheduledDate`) são `date`. Disponibilidades são minutos desde 00:00 no horário local e o plano guarda um timezone IANA. Instantes reais e inícios planejados são UTC. A conversão local→UTC ocorre ao aplicar a prévia; horários inexistentes em transições de fuso são rejeitados.

Exclusão de plano é arquivamento. FKs históricas usam `RESTRICT` ou `SET NULL`, nunca cascata sobre tarefas, revisões e sessões.

## Algoritmo

O serviço puro `generateSchedule`:

1. valida período, assuntos, objetivos e janelas;
2. calcula a capacidade civil do período;
3. ordena assuntos por prioridade e estratégia, com desempate pelo ID;
4. distribui blocos em ordem cronológica, alternando assuntos;
5. ignora intervalos ocupados por atividades concluídas ou bloqueadas;
6. cria `generationKey` determinística;
7. devolve minutos e assuntos não alocados sem exceder a capacidade.

`BALANCED` atribui peso 1 por objetivo; `PRIORITY_BASED` usa `priorityWeight`; `DEADLINE_BASED` multiplica o peso pela urgência de prazos confirmados. Na ausência de peso curricular, a prioridade manual (padrão 3) é explicitamente uma estimativa. Nomes nunca são usados para deduplicar: a equivalência depende do ID estruturado.

## Prévia, concorrência e replanejamento

Cada mudança estrutural incrementa `StudyPlan.version`. A prévia registra essa versão, expira em 30 minutos e só pode ser aplicada uma vez quando `preview.planVersion`, versão enviada e versão atual coincidem. A aplicação é transacional, usa chave idempotente por plano e cria uma revisão. Replanejamento remove somente tarefas automáticas pendentes; concluídas, bloqueadas, sessões e tarefas manuais permanecem.

## API (`/api/v1`)

- `GET|POST /study-plans`, `GET|PATCH|DELETE /study-plans/:id`
- `POST /study-plans/:id/goals`, `DELETE /study-plans/:id/goals/:goalId`
- `POST /study-plans/:id/topics`
- `GET|PUT /study-plans/:id/availability`
- `POST /study-plans/:id/generate-preview`, `/replan-preview`, `/apply-preview`, `/apply-replan`
- `GET /study-plans/:id/schedule`, `/progress`
- `GET|POST /study-tasks`, `PATCH|DELETE /study-tasks/:id`
- `GET|POST /study-sessions`, `PATCH /study-sessions/:id`

Todas as rotas recebem o ator da sessão, validam entrada com Zod e retornam problemas como `application/problem+json`.
