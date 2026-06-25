import { useLiveQuery } from "dexie-react-hooks";
import { getPlannedTasks, type PlannedBuckets } from "@/queries";

const EMPTY: PlannedBuckets = { today: [], tomorrow: [], thisWeek: [], later: [] };

export function usePlannedTasks(): PlannedBuckets {
  return useLiveQuery(() => getPlannedTasks(), [], EMPTY);
}
