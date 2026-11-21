import "server-only";

import { createOrganizationService } from "@/domains/personal-organization/service";
import { personalOrganizationRepository } from "@/server/dal/personal-organization";

export const personalOrganizationService = createOrganizationService(personalOrganizationRepository);
