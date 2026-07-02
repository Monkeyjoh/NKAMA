import { useAsync } from "@/hooks/useAsync";
import { listTenants, getTenantDetail } from "@/services/tenantsService";

/** Liste des locataires. */
export function useTenants() {
  return useAsync(listTenants, [], []);
}

/** Fiche détaillée d'un locataire. @param {string} id */
export function useTenant(id) {
  return useAsync(() => getTenantDetail(id), [id], null);
}
