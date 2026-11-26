import {
  addDays,
  dayNumber,
  endDate,
  firstBrokenDate,
  isDayComplete,
  type DayRecord,
} from "./engine";
import {
  HARD_TASKS,
  SOFT_TASKS,
  type MissPolicy,
  type ProgramId,
  type TaskDef,
} from "./programs";

export type Attempt = {
  id: string;
  startDate: string;
  status: "active" | "ended" | "completed";
  endedOn?: string;
  days: Record<string, DayRecord>;
};

export type Journey = {
  id: string;
  program: ProgramId;
  name: string;
  timeZone: string;
  length: number;
  missPolicy: MissPolicy;
  recoveryWeekday?: number;
  tasks: TaskDef[];
  attempts: Attempt[];
};

export function createJourney(input: {
  program: ProgramId;
  name: string;
  timeZone: string;
  today: string;
  length?: number;
  missPolicy: MissPolicy;
  recoveryWeekday?: number;
  tasks: TaskDef[];
}): Journey {
  const journey: Journey = {
    id: makeId(),
    program: input.program,
    name: input.name,
    timeZone: input.timeZone,
    length: input.length ?? 75,
    missPolicy: input.missPolicy,
    recoveryWeekday: input.recoveryWeekday,
    tasks: input.tasks,
    attempts: [],
  };
  return {
    ...journey,
    attempts: [createAttempt(input.today)],
  };
}

export function hardJourney(timeZone: string, today: string): Journey {
  return createJourney({
    program: "hard",
    name: "75 Hard",
    timeZone,
    today,
    missPolicy: "restart",
    tasks: HARD_TASKS,
  });
}

export function softJourney(timeZone: string, today: string, recoveryWeekday: number): Journey {
  return createJourney({
    program: "soft",
    name: "75 Soft",
    timeZone,
    today,
    missPolicy: "continue",
    recoveryWeekday,
    tasks: SOFT_TASKS,
  });
}

export function activeAttempt(journey: Journey): Attempt | null {
  for (let index = journey.attempts.length - 1; index >= 0; index -= 1) {
    if (journey.attempts[index].status === "active") return journey.attempts[index];
  }
  return null;
}

export function latestAttempt(journey: Journey): Attempt {
  return journey.attempts[journey.attempts.length - 1];
}

export function taskIds(journey: Journey): string[] {
  return journey.tasks.map((task) => task.id);
}

export function refreshJourney(journey: Journey, today: string): Journey {
  const attempt = activeAttempt(journey);
  if (!attempt) return journey;
  const ids = taskIds(journey);
  const lastDay = endDate(attempt.startDate, journey.length);

  if (journey.missPolicy === "restart") {
    const broken = firstBrokenDate(attempt.startDate, today, ids, attempt.days);
    if (broken) {
      return replaceAttempt(journey, {
        ...attempt,
        status: "ended",
        endedOn: broken,
      });
    }
  }

  if (today > lastDay) {
    const finished = eachDayComplete(attempt, ids, lastDay);
    return replaceAttempt(journey, {
      ...attempt,
      status: finished || journey.missPolicy === "continue" ? "completed" : "ended",
      endedOn: finished ? undefined : firstBrokenDate(attempt.startDate, addDays(lastDay, 1), ids, attempt.days) ?? lastDay,
    });
  }

  return journey;
}

export function toggleTask(journey: Journey, today: string, taskId: string): Journey {
  const attempt = activeAttempt(journey);
  if (!attempt) return journey;
  if (today < attempt.startDate) return journey;
  if (dayNumber(attempt.startDate, today) > journey.length) return journey;
  const current = attempt.days[today] ?? { done: {} };
  const done = { ...current.done, [taskId]: !current.done[taskId] };
  return writeDay(journey, attempt, today, { ...current, done });
}

export function setDayPhoto(journey: Journey, today: string, photo: string | undefined): Journey {
  const attempt = activeAttempt(journey);
  if (!attempt) return journey;
  const current = attempt.days[today] ?? { done: {} };
  return writeDay(journey, attempt, today, { ...current, photo });
}

export function setSelfie(journey: Journey, today: string, selfie: string | undefined): Journey {
  const attempt = activeAttempt(journey);
  if (!attempt) return journey;
  const current = attempt.days[today] ?? { done: {} };
  return writeDay(journey, attempt, today, { ...current, selfie });
}

export function missToday(journey: Journey, today: string): Journey {
  const attempt = activeAttempt(journey);
  if (!attempt || journey.missPolicy !== "restart") return journey;
  return replaceAttempt(journey, {
    ...attempt,
    status: "ended",
    endedOn: today,
  });
}

export function beginAgain(journey: Journey, today: string): Journey {
  return {
    ...journey,
    attempts: [...journey.attempts, createAttempt(today)],
  };
}

export function todayTasksComplete(journey: Journey, today: string): boolean {
  const attempt = activeAttempt(journey);
  if (!attempt) return false;
  return isDayComplete(taskIds(journey), attempt.days[today]);
}

function eachDayComplete(attempt: Attempt, ids: string[], lastDay: string): boolean {
  let cursor = attempt.startDate;
  while (cursor <= lastDay) {
    if (!isDayComplete(ids, attempt.days[cursor])) return false;
    cursor = addDays(cursor, 1);
  }
  return true;
}

function writeDay(journey: Journey, attempt: Attempt, date: string, day: DayRecord): Journey {
  return replaceAttempt(journey, {
    ...attempt,
    days: { ...attempt.days, [date]: day },
  });
}

function replaceAttempt(journey: Journey, next: Attempt): Journey {
  return {
    ...journey,
    attempts: journey.attempts.map((attempt) => (attempt.id === next.id ? next : attempt)),
  };
}

function createAttempt(today: string): Attempt {
  return {
    id: makeId(),
    startDate: today,
    status: "active",
    days: {},
  };
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
