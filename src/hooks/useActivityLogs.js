import { useAsync } from "@/hooks/useAsync";
import { listActivityLogs } from "@/services/activityLogsService";

/** Journal d'audit. */
export function useActivityLogs() {
  return useAsync(listActivityLogs, [], []);
}
