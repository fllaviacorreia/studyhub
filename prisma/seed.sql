-- Seed idempotente e explicitamente fictício para desenvolvimento.
INSERT INTO "Organization" ("id", "name", "normalizedName", "acronym", "description", "country", "createdAt", "updatedAt")
VALUES ('10000000-0000-4000-8000-000000000001', 'Instituto Exemplo de Administração', 'instituto exemplo de administração', 'IEA', 'Instituição fictícia usada somente para demonstração.', 'BR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

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
