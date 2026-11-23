# Catálogo de concursos

O catálogo é global e separado dos dados privados. Instituições, bancas, concursos, cargos, especialidades, editais, disciplinas e conteúdos programáticos não possuem proprietário. Objetivos continuam privados e apenas guardam referências ao catálogo.

## Publicação e curadoria

- `USER` consulta concursos, editais, disciplinas e conteúdos com estado `PUBLISHED`.
- `CURATOR` e `ADMIN` também consultam rascunhos e podem criar registros.
- Datas e status não mudam automaticamente. Uma pessoa autorizada deve confirmar a fonte.
- Referências oficiais ficam em `officialUrl`, `sourceReference`, URLs e hashes das versões.
- Retificações são documentos próprios ligados por `originalNoticeId`; versões não substituem silenciosamente o histórico.
- A tela `/app/catalogo/administracao` cria os registros iniciais como rascunho.

## API

Todas as rotas exigem sessão e retornam erros no formato `application/problem+json`.

| Método | Rota | Uso |
| --- | --- | --- |
| `GET/POST` | `/api/v1/organizations` | lista/cria instituições |
| `GET/PATCH` | `/api/v1/organizations/:id` | detalhes/edição da instituição |
| `GET/POST` | `/api/v1/exam-boards` | lista/cria bancas |
| `GET/POST` | `/api/v1/examinations` | filtros/criação de concursos |
| `GET/PATCH` | `/api/v1/examinations/:id` | detalhe/edição do concurso |
| `GET/POST` | `/api/v1/examinations/:id/positions` | cargos e especialidades |
| `GET/POST` | `/api/v1/examinations/:id/notices` | editais e retificações |
| `POST` | `/api/v1/notices/:id/versions` | versão documental histórica |
| `GET/POST` | `/api/v1/examinations/:id/syllabuses` | conteúdo hierárquico |
| `GET/POST` | `/api/v1/subjects` | disciplinas reutilizáveis |
| `GET/POST` | `/api/v1/subjects/:id/topics` | taxonomia hierárquica |
| `PUT` | `/api/v1/study-goals/:id/catalog` | substitui/desfaz vínculos privados |

Listas usam cursor e `limit`; concursos aceitam `search`, `organizationId`, `examBoardId`, `year` e `status`.

## Dados de desenvolvimento

`npm run db:seed` insere registros idempotentes e explicitamente fictícios. O seed não contém fatos históricos de SEFAZ-BA, ANPD ou qualquer concurso real.

## Validação manual

1. Aplique migrations e seed.
2. Entre com usuário comum e abra `/app/concursos`.
3. Confirme que `POST /api/v1/organizations` retorna `403`.
4. Promova um usuário para `CURATOR`, entre novamente e abra `/app/catalogo/administracao`.
5. Cadastre instituição e concurso; confira que nasce como rascunho.
6. Em `/app/objetivos`, vincule e desvincule concurso, cargos e especialidades.
7. Tente alterar o objetivo de outro usuário: a resposta deve ser `404`.
