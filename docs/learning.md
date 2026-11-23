# Biblioteca de conteúdos e banco de questões

## Limites e autorização

`Material` e `Question` formam o catálogo compartilhado. Usuários comuns consultam itens publicados compartilhados/públicos e os próprios rascunhos; somente `CURATOR` e `ADMIN` criam, alteram, publicam ou arquivam pelo fluxo editorial. `LearningProgress`, `ExerciseList`, `QuestionSession` e `QuestionAttempt` são privados e todas as consultas recebem o ator da sessão na DAL.

Conteúdo autoral, licenciado, oficial e gerado por IA conserva procedência. Questões oficiais exigem referência verificável. Importação automática e geração por IA não fazem parte desta etapa.

## Versionamento e correção

Cada publicação de questão cria um `QuestionVersion` imutável contendo enunciado, explicação, alternativas e gabarito. `QuestionSessionItem` fixa a versão e a ordem usadas na sessão; `QuestionAttempt` referencia essa mesma versão. Uma correção editorial futura não altera resultados históricos.

- `SINGLE_CHOICE`: exatamente uma opção correta e uma opção selecionada.
- `TRUE_FALSE`: exatamente duas opções, uma correta e uma selecionada.
- `MULTIPLE_CHOICE`: acerto apenas com o conjunto exato de opções corretas; não há pontuação parcial.
- `PRACTICE`: correção, gabarito e explicação podem ser retornados após cada resposta.
- `EXAM`: a submissão apenas confirma o registro; resultado, explicação e gabarito só aparecem após `finish`.

Sessões e respostas aceitam uma chave idempotente. Pontuação e acerto são calculados exclusivamente no backend. Uma questão recebe no máximo uma tentativa por sessão nesta versão.

## Progresso e métricas

O progresso é único por `(userId, materialId)` e independe de objetivo ou plano. Abrir um material não o conclui. O leitor salva percentual/posição, e conclusão explícita fixa 100%. Atualizações do conteúdo não apagam o progresso ligado à identidade estável do material.

Os indicadores consideram todas as tentativas válidas e exibem separadamente a quantidade de questões únicas. Agregações por disciplina/assunto podem contar uma tentativa em cada classificação associada, mas o total global nunca é duplicado.

`StudySession` continua sendo a única fonte de duração estudada. `QuestionSession` pode referenciá-la e armazena apenas métricas da resolução; portanto o tempo não é somado duas vezes. `PlanTask` pode apontar para um material (teoria) ou lista (prática).

## API

Todos os endpoints ficam sob `/api/v1`: `learning-materials`, `learning-progress`, `questions`, `exercise-lists`, `question-sessions` e `performance`. Erros seguem `application/problem+json`, entradas usam Zod, listas têm cursor/limite e parâmetros dinâmicos seguem a API assíncrona do Next.js 16.

## Validação manual

1. Execute `npm run db:migrate:deploy` e `npm run db:seed`.
2. Entre com um usuário e abra `/app/biblioteca`; leia o conteúdo demonstrativo e salve/conclua o progresso.
3. Abra `/app/questoes`, inicie a lista demonstrativa e responda às questões.
4. Confirme que prática revela a correção imediatamente e que simulado só a revela no resultado final.
5. Abra `/app/desempenho` e confira totais, disciplinas e assuntos.
6. Com papel `CURATOR`/`ADMIN`, acesse `/app/biblioteca/administracao` e crie um rascunho.
