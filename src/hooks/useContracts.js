import { useAsync } from "@/hooks/useAsync";
import { listContracts, getContractDetail } from "@/services/contractsService";

/** Liste des contrats (baux). */
export function useContracts() {
  return useAsync(listContracts, [], []);
}

/** Fiche détaillée d'un contrat. @param {string} id */
export function useContract(id) {
  return useAsync(() => getContractDetail(id), [id], null);
}
