import { OrganizationError } from "./errors";
import type {
  CreateObjectiveInput,
  CreateStudyAreaInput,
  UpdateObjectiveInput,
  UpdateStudyAreaInput,
} from "./schemas";

export interface OrganizationRepository {
  listAreas(actorId: string, query: AreaListQuery): Promise<unknown>;
  getArea(actorId: string, id: string): Promise<unknown | null>;
  createArea(actorId: string, input: CreateStudyAreaInput): Promise<unknown>;
  updateArea(
    actorId: string,
    id: string,
    input: UpdateStudyAreaInput,
  ): Promise<unknown | null>;
  deleteArea(
    actorId: string,
    id: string,
  ): Promise<"deleted" | "not_found" | "has_objectives">;
  listObjectives(actorId: string, query: ObjectiveListQuery): Promise<unknown>;
  getObjective(actorId: string, id: string): Promise<unknown | null>;
  createObjective(
    actorId: string,
    input: CreateObjectiveInput,
  ): Promise<unknown | null>;
  updateObjective(
    actorId: string,
    id: string,
    input: UpdateObjectiveInput,
  ): Promise<unknown | null>;
  deleteObjective(
    actorId: string,
    id: string,
  ): Promise<"deleted" | "not_found" | "has_history">;
  dashboard(actorId: string): Promise<unknown>;
}

export type AreaListQuery = {
  cursor?: string;
  limit: number;
  status?: "ACTIVE" | "ARCHIVED";
};
export type ObjectiveListQuery = {
  cursor?: string;
  limit: number;
  areaId?: string;
  status?: "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
  priority?: number;
  hasTargetDate?: boolean;
};

export function createOrganizationService(repository: OrganizationRepository) {
  return {
    listAreas: repository.listAreas.bind(repository),
    getArea: async (actorId: string, id: string) => {
      const area = await repository.getArea(actorId, id);
      if (!area)
        throw new OrganizationError("NOT_FOUND", "Área não encontrada.");
      return area;
    },
    createArea: repository.createArea.bind(repository),
    updateArea: async (
      actorId: string,
      id: string,
      input: UpdateStudyAreaInput,
    ) => {
      const area = await repository.updateArea(actorId, id, input);
      if (!area)
        throw new OrganizationError("NOT_FOUND", "Área não encontrada.");
      return area;
    },
    deleteArea: async (actorId: string, id: string) => {
      const result = await repository.deleteArea(actorId, id);
      if (result === "not_found")
        throw new OrganizationError("NOT_FOUND", "Área não encontrada.");
      if (result === "has_objectives") {
        throw new OrganizationError(
          "CONFLICT",
          "Arquive a área ou remova seus objetivos antes de excluí-la.",
        );
      }
    },
    listObjectives: repository.listObjectives.bind(repository),
    getObjective: async (actorId: string, id: string) => {
      const objective = await repository.getObjective(actorId, id);
      if (!objective)
        throw new OrganizationError("NOT_FOUND", "Objetivo não encontrado.");
      return objective;
    },
    createObjective: async (actorId: string, input: CreateObjectiveInput) => {
      const objective = await repository.createObjective(actorId, input);
      if (!objective)
        throw new OrganizationError(
          "INVALID_DEPENDENCY",
          "A área informada não pertence a você.",
        );
      return objective;
    },
    updateObjective: async (
      actorId: string,
      id: string,
      input: UpdateObjectiveInput,
    ) => {
      const objective = await repository.updateObjective(actorId, id, input);
      if (!objective) {
        throw new OrganizationError(
          input.studyAreaId ? "INVALID_DEPENDENCY" : "NOT_FOUND",
          input.studyAreaId
            ? "O objetivo ou a área informada não pertence a você."
            : "Objetivo não encontrado.",
        );
      }
      return objective;
    },
    deleteObjective: async (actorId: string, id: string) => {
      const result = await repository.deleteObjective(actorId, id);
      if (result === "not_found") {
        throw new OrganizationError("NOT_FOUND", "Objetivo não encontrado.");
      }
      if (result === "has_history") {
        throw new OrganizationError(
          "CONFLICT",
          "Arquive o objetivo: planos ou sessões de estudo impedem sua exclusão.",
        );
      }
    },
    dashboard: repository.dashboard.bind(repository),
  };
}
