import { useAsync } from "@/hooks/useAsync";
import { listProperties, getProperty } from "@/services/propertiesService";

/** Liste des biens. */
export function useProperties() {
  return useAsync(listProperties, [], []);
}

/** Détail d'un bien. @param {string} id */
export function useProperty(id) {
  return useAsync(() => getProperty(id), [id], null);
}
