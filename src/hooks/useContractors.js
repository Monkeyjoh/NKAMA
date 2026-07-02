import { useAsync } from "@/hooks/useAsync";
import { listContractors } from "@/services/contractorsService";

/** Liste des prestataires. */
export function useContractors() {
  return useAsync(listContractors, [], []);
}
