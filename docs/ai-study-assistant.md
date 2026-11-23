# Tutor inteligente

## Arquitetura e provedor

O módulo mantém a regra fora de `src/app`: rotas adaptam HTTP, a DAL aplica escopo e os serviços orquestram recuperação, contexto, geração e recomendações. `AIProvider` permite trocar o provedor; `OpenAIResponsesProvider` usa o SDK oficial e a Responses API com modelo configurado por `OPENAI_MODEL`, `store: false`, timeout, cancelamento por `AbortSignal` e no máximo um retry transitório.

O segredo `OPENAI_API_KEY` existe somente no backend. A suíte padrão usa provedores falsos e nunca faz chamadas pagas. A integração real é opt-in pela configuração do ambiente.

## Dados, retenção e privacidade

O StudyHub persiste conversas e respostas vinculadas enquanto o plano de estudos existir; a remoção física do plano remove essas conversas e mensagens, preservando registros agregados de uso sem o vínculo. Conversas sem plano permanecem até arquivamento e futura solicitação de exclusão conforme a política da aplicação. O provedor recebe somente a pergunta, até oito mensagens recentes, trechos recuperados e, quando necessários, agregados determinísticos. A requisição usa `store: false`; prompts integrais não são copiados para logs operacionais. Registros de uso guardam modelo, operação e tokens, sem credenciais.

Conversas privadas não alimentam catálogo global. Conteúdo gerado fica como resultado de job em estado de rascunho e não é publicado automaticamente. Para exercício de direitos da LGPD, a remoção deve abranger conversa, mensagens e registros pessoais associados conforme a política institucional; fontes editoriais versionadas não são apagadas junto com a conversa.

## Recuperação e citações

A estratégia inicial é busca textual no PostgreSQL sobre `Material` e sua versão mais recente. É a opção de menor custo operacional para o volume atual e permite aplicar autorização antes da recuperação. Cada trecho carrega `sourceId`, `sourceVersionId`, título, URL e versão. O texto recuperado é tratado como dado não confiável e nunca como instrução.

Materiais privados só são recuperados para o autor. Materiais públicos exigem publicação; materiais compartilhados também exigem autorização explícita em `MaterialAccess`. A interface do recuperador permite migrar para busca híbrida com `pgvector` quando métricas de relevância justificarem; não há dois índices concorrentes nesta entrega.

## Ferramentas internas

O tutor seleciona contexto por intenção e chama contratos limitados: desempenho agregado existente, assuntos fracos, planos ativos, revisões vencidas e busca de materiais. A identidade vem da sessão. Não há SQL arbitrário, ferramenta genérica de escrita ou alteração automática de plano. IDs de objetivo/plano são revalidados pela DAL.

## Endpoints

- `GET|POST /api/ai/conversations`
- `GET|PATCH /api/ai/conversations/:id`
- `GET|POST /api/ai/conversations/:id/messages`
- `POST /api/ai/generate/{summary|explanation|study-guide|questions}`
- `GET|POST /api/ai/recommendations`
- `POST /api/ai/recommendations/:id/{accept|reject}`
- `GET /api/ai/usage?days=30`

Entradas usam Zod e erros seguem `application/problem+json`. Questões geradas validam alternativas, gabarito e cardinalidade antes de concluir o job.

## Limites e governança

As variáveis `AI_REQUESTS_PER_DAY` (20 inicialmente), `AI_TOKENS_PER_DAY` (50.000 inicialmente), `AI_MAX_OUTPUT_TOKENS`, `AI_TIMEOUT_MS`, `AI_CONTEXT_MESSAGES` e `AI_RETRIEVAL_LIMIT` controlam consumo. Há uma geração concorrente por usuário na implementação atual. Custos monetários não são calculados com tabela fixa; somente tokens reais informados pelo provedor são registrados, deixando a precificação para uma configuração futura versionada.

O tutor não revela gabaritos de provas em andamento, pois não recebe opções corretas nem dispõe de ferramenta para consultá-las. Recomendações aceitas apenas registram a decisão; qualquer alteração futura deve chamar a prévia/replanejamento existente com confirmação explícita.

## Limitações

- A recuperação textual ainda não usa embeddings nem indexa arquivos binários.
- O cancelamento interrompe a chamada HTTP, mas a resposta desta primeira versão chega ao navegador após conclusão; streaming incremental do token fica pendente.
- Não há suíte E2E de navegador configurada no repositório.
- Validação estrutural não substitui revisão factual e pedagógica.
