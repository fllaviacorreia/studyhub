import { CatalogError } from "./errors";
import type { ExamBoardInput, ExaminationInput, ExaminationUpdateInput, NoticeInput, NoticeVersionInput, ObjectiveCatalogLinkInput, OrganizationInput, OrganizationUpdateInput, PositionInput, SubjectInput, SyllabusInput, TopicInput } from "./schemas";

export type CatalogActor = { id: string; role: "USER" | "CURATOR" | "ADMIN" };
export type ExaminationListQuery = { cursor?: string; limit: number; search?: string; organizationId?: string; examBoardId?: string; year?: number; status?: ExaminationInput["status"] };
export type SearchQuery = { cursor?: string; limit: number; search?: string };

export interface CatalogRepository {
  listOrganizations(query: SearchQuery): Promise<unknown>; getOrganization(id: string): Promise<unknown | null>; createOrganization(input: OrganizationInput): Promise<unknown>; updateOrganization(id: string, input: OrganizationUpdateInput): Promise<unknown | null>;
  listExamBoards(query: SearchQuery): Promise<unknown>; createExamBoard(input: ExamBoardInput): Promise<unknown>;
  listExaminations(query: ExaminationListQuery, canReview: boolean): Promise<unknown>; getExamination(id: string, canReview: boolean): Promise<unknown | null>; createExamination(input: ExaminationInput): Promise<unknown>; updateExamination(id: string, input: ExaminationUpdateInput): Promise<unknown | null>;
  createPosition(examinationId: string, input: PositionInput): Promise<unknown | null>; createNotice(examinationId: string, input: NoticeInput): Promise<unknown | null>; createNoticeVersion(noticeId: string, input: NoticeVersionInput): Promise<unknown | null>;
  listSubjects(query: SearchQuery, canReview: boolean): Promise<unknown>; getSubjectTopics(id: string, canReview: boolean): Promise<unknown | null>; createSubject(input: SubjectInput): Promise<unknown>; createTopic(subjectId: string, input: TopicInput): Promise<unknown | null>;
  createSyllabus(examinationId: string, input: SyllabusInput): Promise<unknown | null>;
  linkObjective(actorId: string, objectiveId: string, input: ObjectiveCatalogLinkInput): Promise<"updated" | "not_found" | "invalid">;
}

export function canEditCatalog(actor: CatalogActor) { return actor.role === "CURATOR" || actor.role === "ADMIN"; }
function requireEditor(actor: CatalogActor) { if (!canEditCatalog(actor)) throw new CatalogError("FORBIDDEN", "Seu perfil não pode alterar o catálogo compartilhado."); }
function found<T>(value: T | null, message: string): T { if (!value) throw new CatalogError("NOT_FOUND", message); return value; }

export function createCatalogService(repository: CatalogRepository) {
  return {
    listOrganizations: repository.listOrganizations.bind(repository),
    getOrganization: async (id: string) => found(await repository.getOrganization(id), "Instituição não encontrada."),
    createOrganization: (actor: CatalogActor, input: OrganizationInput) => { requireEditor(actor); return repository.createOrganization(input); },
    updateOrganization: async (actor: CatalogActor, id: string, input: OrganizationUpdateInput) => { requireEditor(actor); return found(await repository.updateOrganization(id, input), "Instituição não encontrada."); },
    listExamBoards: repository.listExamBoards.bind(repository),
    createExamBoard: (actor: CatalogActor, input: ExamBoardInput) => { requireEditor(actor); return repository.createExamBoard(input); },
    listExaminations: (actor: CatalogActor, query: ExaminationListQuery) => repository.listExaminations(query, canEditCatalog(actor)),
    getExamination: async (actor: CatalogActor, id: string) => found(await repository.getExamination(id, canEditCatalog(actor)), "Concurso não encontrado."),
    createExamination: (actor: CatalogActor, input: ExaminationInput) => { requireEditor(actor); return repository.createExamination(input); },
    updateExamination: async (actor: CatalogActor, id: string, input: ExaminationUpdateInput) => { requireEditor(actor); return found(await repository.updateExamination(id, input), "Concurso não encontrado."); },
    createPosition: async (actor: CatalogActor, id: string, input: PositionInput) => { requireEditor(actor); return found(await repository.createPosition(id, input), "Concurso não encontrado."); },
    createNotice: async (actor: CatalogActor, id: string, input: NoticeInput) => { requireEditor(actor); return found(await repository.createNotice(id, input), "Concurso ou edital original incompatível."); },
    createNoticeVersion: async (actor: CatalogActor, id: string, input: NoticeVersionInput) => { requireEditor(actor); return found(await repository.createNoticeVersion(id, input), "Edital não encontrado."); },
    listSubjects: (actor: CatalogActor, query: SearchQuery) => repository.listSubjects(query, canEditCatalog(actor)),
    getSubjectTopics: async (actor: CatalogActor, id: string) => found(await repository.getSubjectTopics(id, canEditCatalog(actor)), "Disciplina não encontrada."),
    createSubject: (actor: CatalogActor, input: SubjectInput) => { requireEditor(actor); return repository.createSubject(input); },
    createTopic: async (actor: CatalogActor, id: string, input: TopicInput) => { requireEditor(actor); return found(await repository.createTopic(id, input), "Disciplina ou assunto superior incompatível."); },
    createSyllabus: async (actor: CatalogActor, id: string, input: SyllabusInput) => { requireEditor(actor); return found(await repository.createSyllabus(id, input), "As associações do conteúdo programático são incompatíveis."); },
    linkObjective: async (actor: CatalogActor, id: string, input: ObjectiveCatalogLinkInput) => { const result = await repository.linkObjective(actor.id, id, input); if (result === "not_found") throw new CatalogError("NOT_FOUND", "Objetivo não encontrado."); if (result === "invalid") throw new CatalogError("INVALID_DEPENDENCY", "Concurso, cargo ou especialidade incompatível."); },
  };
}
