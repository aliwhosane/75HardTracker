import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Journey } from "./journey";

const KEY = "@75:journey";

export async function loadJourney(): Promise<Journey | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as Journey;
  if (!parsed || !Array.isArray(parsed.attempts) || !Array.isArray(parsed.tasks)) return null;
  return parsed;
}

export async function saveJourney(journey: Journey | null): Promise<void> {
  if (!journey) {
    await AsyncStorage.removeItem(KEY);
    return;
  }
  await AsyncStorage.setItem(KEY, JSON.stringify(journey));
}
