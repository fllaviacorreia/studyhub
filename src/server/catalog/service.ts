import "server-only";
import { createCatalogService } from "@/domains/catalog/service";
import { catalogRepository } from "@/server/dal/catalog";
export const catalogService = createCatalogService(catalogRepository);
