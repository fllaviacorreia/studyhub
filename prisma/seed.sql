-- Seed idempotente e explicitamente fictício para desenvolvimento.
INSERT INTO "Organization" ("id", "name", "normalizedName", "acronym", "description", "country", "createdAt", "updatedAt")
VALUES ('10000000-0000-4000-8000-000000000001', 'Instituto Exemplo de Administração', 'instituto exemplo de administração', 'IEA', 'Instituição fictícia usada somente para demonstração.', 'BR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- A taxonomia vem antes dos conteúdos que a referenciam; as repetições abaixo são idempotentes.
INSERT INTO "Subject" ("id", "name", "slug", "description", "status", "createdAt", "updatedAt") VALUES
  ('50000000-0000-4000-8000-000000000001', 'Língua Portuguesa', 'lingua-portuguesa', 'Disciplina genérica.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('50000000-0000-4000-8000-000000000002', 'Engenharia de Software', 'engenharia-de-software', 'Disciplina genérica.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

-- Curador técnico sem credencial, usado apenas como autoria dos dados fictícios.
INSERT INTO "User" ("id", "name", "email", "role", "createdAt", "updatedAt")
VALUES ('70000000-0000-4000-8000-000000000001', 'Curadoria de Demonstração', 'curadoria-demo@studyhub.local', 'CURATOR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "Topic" ("id", "subjectId", "parentId", "name", "slug", "description", "position", "createdAt", "updatedAt") VALUES
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000002', NULL, 'Requisitos de software', 'requisitos-de-software', 'Assunto demonstrativo.', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000002', NULL, 'Testes de software', 'testes-de-software', 'Assunto demonstrativo.', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "Material" ("id", "authorId", "title", "slug", "summary", "kind", "contentFormat", "provenance", "visibility", "status", "currentVersion", "estimatedMinutes", "publishedAt", "createdAt", "updatedAt")
VALUES ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Introdução a requisitos de software', 'introducao-requisitos-demo', 'Material curto, autoral e fictício para validar a biblioteca.', 'ARTICLE', 'MARKDOWN', 'AUTHORED', 'PUBLIC', 'PUBLISHED', 1, 8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
INSERT INTO "MaterialVersion" ("id", "materialId", "version", "content", "changeDescription", "createdById", "aiGenerated", "createdAt")
VALUES ('81000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 1, '# Requisitos de software

Requisitos descrevem necessidades e restrições que uma solução deve atender.

## Tipos

Requisitos funcionais descrevem comportamentos. Requisitos não funcionais registram qualidades e restrições.', 'Publicação demonstrativa inicial.', '70000000-0000-4000-8000-000000000001', false, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
INSERT INTO "MaterialTopic" ("materialId", "topicId", "isPrimary", "createdAt") VALUES ('80000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000002', true, CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO "ContentSource" ("id", "materialId", "title", "sourceType", "author", "description", "createdAt") VALUES ('82000000-0000-4000-8000-000000000001', '80000000-0000-4000-8000-000000000001', 'Conteúdo autoral demonstrativo do StudyHub', 'ORIGINAL_CONTENT', 'Curadoria de Demonstração', 'Não representa documento oficial.', CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;

INSERT INTO "Question" ("id", "authorId", "kind", "difficulty", "provenance", "visibility", "status", "statement", "explanation", "sourceLabel", "currentVersion", "publishedAt", "createdAt", "updatedAt") VALUES
 ('90000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','SINGLE_CHOICE','EASY','AUTHORED','PUBLIC','PUBLISHED','Qual alternativa descreve um requisito funcional?','Ele descreve um comportamento observável do sistema.','Questão autoral demonstrativa',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('90000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000001','TRUE_FALSE','EASY','AUTHORED','PUBLIC','PUBLISHED','Requisitos não funcionais podem registrar atributos de qualidade.','Desempenho, segurança e disponibilidade são exemplos.','Questão autoral demonstrativa',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('90000000-0000-4000-8000-000000000003','70000000-0000-4000-8000-000000000001','MULTIPLE_CHOICE','MEDIUM','AUTHORED','PUBLIC','PUBLISHED','Selecione práticas que ajudam a validar requisitos.','Revisões e protótipos permitem encontrar ambiguidades.','Questão autoral demonstrativa',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('90000000-0000-4000-8000-000000000004','70000000-0000-4000-8000-000000000001','SINGLE_CHOICE','MEDIUM','AUTHORED','PUBLIC','PUBLISHED','Qual teste verifica uma unidade isolada de código?','O teste unitário limita o escopo a uma unidade.','Questão autoral demonstrativa',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('90000000-0000-4000-8000-000000000005','70000000-0000-4000-8000-000000000001','TRUE_FALSE','HARD','AUTHORED','PUBLIC','PUBLISHED','Uma tentativa histórica deve mudar quando o gabarito editorial é corrigido.','Tentativas preservam a versão usada na correção original.','Questão autoral demonstrativa',1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "QuestionOption" ("id","questionId","label","text","isCorrect","position","createdAt","updatedAt") VALUES
 ('91000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000001','A','O sistema deve permitir recuperar a senha.',true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP), ('91000000-0000-4000-8000-000000000002','90000000-0000-4000-8000-000000000001','B','O sistema deve ser moderno.',false,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('91000000-0000-4000-8000-000000000003','90000000-0000-4000-8000-000000000002','V','Verdadeiro',true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP), ('91000000-0000-4000-8000-000000000004','90000000-0000-4000-8000-000000000002','F','Falso',false,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('91000000-0000-4000-8000-000000000005','90000000-0000-4000-8000-000000000003','A','Revisar com partes interessadas.',true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP), ('91000000-0000-4000-8000-000000000006','90000000-0000-4000-8000-000000000003','B','Criar protótipos.',true,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP), ('91000000-0000-4000-8000-000000000007','90000000-0000-4000-8000-000000000003','C','Ignorar ambiguidades.',false,2,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('91000000-0000-4000-8000-000000000008','90000000-0000-4000-8000-000000000004','A','Teste unitário.',true,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP), ('91000000-0000-4000-8000-000000000009','90000000-0000-4000-8000-000000000004','B','Teste de aceitação.',false,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
 ('91000000-0000-4000-8000-000000000010','90000000-0000-4000-8000-000000000005','V','Verdadeiro',false,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP), ('91000000-0000-4000-8000-000000000011','90000000-0000-4000-8000-000000000005','F','Falso',true,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "QuestionTopic" ("questionId","topicId","isPrimary") VALUES
 ('90000000-0000-4000-8000-000000000001','60000000-0000-4000-8000-000000000002',true), ('90000000-0000-4000-8000-000000000002','60000000-0000-4000-8000-000000000002',true), ('90000000-0000-4000-8000-000000000003','60000000-0000-4000-8000-000000000002',true), ('90000000-0000-4000-8000-000000000004','60000000-0000-4000-8000-000000000003',true), ('90000000-0000-4000-8000-000000000005','60000000-0000-4000-8000-000000000003',true)
ON CONFLICT DO NOTHING;

INSERT INTO "QuestionVersion" ("id","questionId","version","kind","statement","explanation","options","createdById","createdAt")
SELECT ('92000000-0000-4000-8000-' || right(replace(q."id"::text,'-',''),12))::uuid, q."id", 1, q."kind", q."statement", q."explanation", jsonb_agg(jsonb_build_object('id',o."id",'label',o."label",'content',o."text",'order',o."position",'isCorrect',o."isCorrect") ORDER BY o."position"), '70000000-0000-4000-8000-000000000001', CURRENT_TIMESTAMP FROM "Question" q JOIN "QuestionOption" o ON o."questionId"=q."id" WHERE q."id"::text LIKE '90000000-0000-4000-8000-%' GROUP BY q."id" ON CONFLICT DO NOTHING;

INSERT INTO "ExerciseList" ("id","userId","title","description","mode","status","createdAt","updatedAt") VALUES ('93000000-0000-4000-8000-000000000001',NULL,'Lista demonstrativa de Engenharia de Software','Conteúdo autoral e fictício.','PRACTICE','PUBLISHED',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) ON CONFLICT DO NOTHING;
INSERT INTO "ExerciseListQuestion" ("id","exerciseListId","questionId","position") SELECT gen_random_uuid(),'93000000-0000-4000-8000-000000000001',"id",row_number() OVER (ORDER BY "id")-1 FROM "Question" WHERE "id"::text LIKE '90000000-0000-4000-8000-%' ON CONFLICT DO NOTHING;

INSERT INTO "ExamBoard" ("id", "name", "normalizedName", "acronym", "createdAt", "updatedAt")
VALUES ('20000000-0000-4000-8000-000000000001', 'Banca Exemplo de Avaliação', 'banca exemplo de avaliação', 'BEA', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "Exam" ("id", "organizationId", "examBoardId", "name", "description", "year", "status", "publicationStatus", "sourceReference", "createdAt", "updatedAt")
VALUES ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Processo Seletivo Demonstrativo', 'Registro fictício; não representa concurso real.', 2027, 'PLANNED', 'PUBLISHED', 'Dados fictícios criados pelo seed de desenvolvimento.', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "ExamPosition" ("id", "examId", "name", "description", "vacancies", "createdAt", "updatedAt")
VALUES ('40000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', 'Analista de Demonstração', 'Cargo fictício para validar o catálogo.', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "Subject" ("id", "name", "slug", "description", "status", "createdAt", "updatedAt") VALUES
  ('50000000-0000-4000-8000-000000000001', 'Língua Portuguesa', 'lingua-portuguesa', 'Disciplina genérica.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('50000000-0000-4000-8000-000000000002', 'Engenharia de Software', 'engenharia-de-software', 'Disciplina genérica.', 'PUBLISHED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO "Topic" ("id", "subjectId", "parentId", "name", "slug", "description", "position", "createdAt", "updatedAt")
VALUES ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000002', NULL, 'Fundamentos de desenvolvimento de software', 'fundamentos-de-desenvolvimento-de-software', 'Assunto introdutório.', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;
