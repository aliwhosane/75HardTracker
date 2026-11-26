import { weekdayIndex } from "./engine";

export type ProgramId = "hard" | "soft" | "custom";
export type MissPolicy = "restart" | "continue";
export type PromptImage =
  | "cover-hard"
  | "cover-soft"
  | "cover-custom"
  | "outdoor"
  | "second"
  | "diet"
  | "water"
  | "read"
  | "photo"
  | "train";

export type TaskDef = {
  id: string;
  label: string;
  detail: string;
  image: PromptImage;
};

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const HARD_TASKS: TaskDef[] = [
  { id: "outdoor", label: "Outside, 45 min", detail: "Continuous. Uncovered.", image: "outdoor" },
  { id: "second", label: "Second, 45 min", detail: "At least 3 hours later.", image: "second" },
  { id: "diet", label: "Diet", detail: "No alcohol. No cheat meal.", image: "diet" },
  { id: "water", label: "One gallon", detail: "Plain, still water.", image: "water" },
  { id: "read", label: "10 pages", detail: "A physical book.", image: "read" },
  { id: "photo", label: "Private photo", detail: "For you. Not for posting.", image: "photo" },
];

export const SOFT_TASKS: TaskDef[] = [
  { id: "eat", label: "Eat well", detail: "Alcohol only on a social occasion.", image: "diet" },
  { id: "train", label: "45 minutes", detail: "Any training.", image: "train" },
  { id: "water", label: "3 liters", detail: "Water.", image: "water" },
  { id: "read", label: "10 pages", detail: "Any book.", image: "read" },
];

export function programName(program: ProgramId, customName?: string): string {
  if (program === "hard") return "75 Hard";
  if (program === "soft") return "75 Soft";
  return customName?.trim() || "Your own";
}

export function tasksForDay(tasks: TaskDef[], date: string, recoveryWeekday?: number): TaskDef[] {
  if (recoveryWeekday === undefined) return tasks;
  if (weekdayIndex(date) !== recoveryWeekday) return tasks;
  return tasks.map((task) =>
    task.id === "train"
      ? { ...task, label: "Active recovery", detail: "45 easier minutes. Still movement." }
      : task
  );
}
