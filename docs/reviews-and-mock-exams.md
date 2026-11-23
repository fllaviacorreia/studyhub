# Revisões, caderno de erros e simulados

## Revisão espaçada

`ReviewSchedule` é único por `(userId, topicId)`, independentemente de quantos objetivos e planos usam o assunto. `ReviewAttempt` é histórico imutável e usa chave idempotente por usuário. Pausar ou arquivar um agendamento não remove tentativas.

O algoritmo puro em `src/domains/reviews/scheduler.ts` é uma política determinística inspirada nos princípios do SM-2, sem copiar implementação externa. O intervalo inicial e mínimo é 1 dia e o máximo é 3.650 dias. `AGAIN` volta a 1 dia; `HARD`, `GOOD` e `EASY` aplicam multiplicadores 1,2, 2 e 3. Atrasos acrescentam bônus limitado a 0,5. O cálculo usa instantes UTC e arredonda dias inteiros. A nota de recordação sempre é informada pelo estudante; erros em questões não a substituem.

## Priorização de dificuldades

A política exige três tentativas únicas por assunto. Sem essa amostra, o resultado é “dados insuficientes”. Com amostra, 70% da prioridade deriva da taxa de erros e até 30 pontos vêm de erros nos últimos 30 dias. Cada resultado inclui uma explicação textual; a pontuação não é previsão de aprovação.

## Caderno de erros

Uma resposta incorreta faz `upsert` de `ErrorNotebookEntry` por `(userId, questionId)` na mesma transação. `QuestionAttempt` continua sendo a fonte de verdade. O registro conserva anotações e estado; acertos posteriores não removem o erro. Refazer cria uma sessão de prática privada usando a correção existente.

## Simulados

`MockExam` guarda configuração, filtros, seed e estratégia. A validação só marca o simulado como pronto quando há questões publicadas suficientes. A seleção usa hash FNV-1a da seed e do ID, portanto é reproduzível e não amplia filtros silenciosamente.

Ao iniciar, `QuestionSessionItem` fixa versão, ordem e seção. Respostas continuam em `QuestionAttempt`; gabaritos de modo `EXAM` ficam ocultos até a finalização. `MockExamAttempt` acrescenta prazo do servidor e snapshot imutável. `SIMPLE` calcula percentual global; `WEIGHTED_BY_SECTION` calcula média ponderada dos blocos. Nenhuma é apresentada como nota oficial.

## Planejamento e tempo

Atividades `REVIEW` podem apontar para `ReviewSchedule`, e `SIMULATION` para `MockExam`; a DAL valida proprietário, estado e tipo. `StudySession` permanece como única fonte de duração.

## Endpoints

- `/api/v1/reviews`, `/due`, `/upcoming`, `/:id`, `/:id/complete`, `/:id/history`
- `/api/v1/error-notebook`, `/:id`, `/:id/retry`
- `/api/v1/mock-exams`, `/:id`, `/:id/generate`, `/:id/start`
- `/api/v1/mock-exam-attempts/:id`, `/answers`, `/finish`, `/results`
- `/api/v1/performance/weak-topics`

Todas as rotas derivam o usuário da sessão. Datas de conclusão são do servidor. Operações críticas são transacionais e/ou idempotentes.

## Limitações atuais

- O editor visual cria inicialmente um bloco; a API aceita múltiplos blocos, filtros e pesos.
- Seções com filtros sobrepostos que repetem questões são recusadas.
- Não há critérios específicos de banca ou regras eliminatórias.
- Testes E2E com navegador não estão configurados no repositório.
