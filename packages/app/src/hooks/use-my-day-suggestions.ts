import { useLiveQuery } from "dexie-react-hooks";
import { getMyDaySuggestions, type MyDaySuggestion } from "@/queries";

const EMPTY: MyDaySuggestion[] = [];

export function useMyDaySuggestions(): MyDaySuggestion[] {
  return useLiveQuery(() => getMyDaySuggestions(), [], EMPTY);
}
