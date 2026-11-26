import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import {
  addDays,
  dayNumber,
  endDate,
  isDayComplete,
  localDateString,
  prettyDate,
  weekdayIndex,
  type DayRecord,
} from "./engine";
import { coverFor, promptSource } from "./images";
import {
  activeAttempt,
  beginAgain,
  hardJourney,
  latestAttempt,
  missToday,
  refreshJourney,
  setDayPhoto,
  setSelfie,
  softJourney,
  todayTasksComplete,
  toggleTask,
  createJourney,
  type Attempt,
  type Journey,
} from "./journey";
import { pickImage, shareDayCard } from "./media";
import { WEEKDAYS, programName, tasksForDay, type TaskDef } from "./programs";
import { loadJourney, saveJourney } from "./storage";

type Route =
  | { name: "start" }
  | { name: "rules"; program: "hard" | "soft" }
  | { name: "custom" }
  | { name: "app"; tab: "today" | "journey" }
  | { name: "share" }
  | { name: "ended" }
  | { name: "finished" }
  | { name: "past"; attemptId: string };

export function Tracker() {
  const [journey, setJourney] = useState<Journey | null | undefined>(undefined);
  const [route, setRoute] = useState<Route>({ name: "start" });
  const [recoveryDay, setRecoveryDay] = useState(0);
  const [customName, setCustomName] = useState("Reading and miles");
  const [customLength, setCustomLength] = useState("75");
  const [customMiss, setCustomMiss] = useState<"restart" | "continue">("continue");
  const [draftTask, setDraftTask] = useState("");
  const [draftDetail, setDraftDetail] = useState("");
  const [customTasks, setCustomTasks] = useState<TaskDef[]>([
    { id: "walk", label: "Run or walk 45 minutes", detail: "Any easy effort counts.", image: "train" },
    { id: "read", label: "Read 10 pages", detail: "Any book.", image: "read" },
    { id: "bed", label: "In bed by 11", detail: "Lights out.", image: "photo" },
  ]);
  const [viewDate, setViewDate] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    loadJourney()
      .then((saved) => {
        if (!alive) return;
        if (!saved) {
          setJourney(null);
          return;
        }
        const today = localDateString(new Date(), saved.timeZone);
        const next = refreshJourney(saved, today);
        setJourney(next);
        setRoute(openingRoute(next));
      })
      .catch(() => {
        if (alive) setJourney(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (journey === undefined) return;
    saveJourney(journey).catch(() => {
      Alert.alert("Could not save", "Your last change is still on screen, but it did not save.");
    });
  }, [journey]);

  const today = useMemo(() => {
    if (!journey) return localDateString(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone);
    return localDateString(new Date(), journey.timeZone);
  }, [journey]);

  function commit(next: Journey | null, nextRoute?: Route) {
    setJourney(next);
    if (nextRoute) setRoute(nextRoute);
  }

  function update(recipe: (current: Journey) => Journey, nextRoute?: Route) {
    setJourney((current) => {
      if (!current) return current;
      return recipe(current);
    });
    if (nextRoute) setRoute(nextRoute);
  }

  if (journey === undefined) {
    return <View style={styles.screen}><Text style={styles.quiet}>Loading your journey…</Text></View>;
  }

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (route.name === "start") {
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.display}>Pick a way to{"\n"}spend 75 days.</Text>
        <Choice
          source={coverFor("hard")}
          chip="Hard"
          chipStyle={styles.chipBlue}
          title="75 Hard"
          line="Five tasks. Miss one, start over."
          onPress={() => setRoute({ name: "rules", program: "hard" })}
        />
        <Choice
          source={coverFor("soft")}
          chip="Soft"
          chipStyle={styles.chipSun}
          title="75 Soft"
          line="Four tasks. One easy day a week."
          onPress={() => setRoute({ name: "rules", program: "soft" })}
        />
        <Choice
          source={coverFor("custom")}
          chip="Yours"
          chipStyle={styles.chipCoral}
          title="Your own"
          line="You write the rules."
          onPress={() => setRoute({ name: "custom" })}
        />
      </ScrollView>
    );
  }

  if (route.name === "rules") {
    const hard = route.program === "hard";
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.link} onPress={() => setRoute({ name: "start" })}>Back</Text>
        <Image source={coverFor(route.program)} style={styles.rulesPhoto} />
        <Text style={styles.display}>{hard ? "75 Hard" : "75 Soft"}</Text>
        <Text style={styles.body}>
          {hard
            ? "Andy Frisella’s program. Five tasks, every day, for 75 days. Miss one and this attempt ends. The days you already kept stay in the record, and the next attempt starts at day 1."
            : "Stephen Gallagher posted this in 2021. It is not Andy Frisella’s program. Four tasks, every day, for 75 days. A miss stays on the calendar and you keep going."}
        </Text>
        {hard ? <HardRules /> : <SoftRules recoveryDay={recoveryDay} onChange={setRecoveryDay} />}
        <Text style={styles.note}>
          This is a record of a program you chose. It is not medical advice. Two workouts and a gallon of water are a heavy load.
        </Text>
        <Pressable
          style={styles.primary}
          onPress={() => {
            const next = hard ? hardJourney(zone, today) : softJourney(zone, today, recoveryDay);
            commit(next, { name: "app", tab: "today" });
          }}
        >
          <Text style={styles.primaryText}>Begin</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (route.name === "custom") {
    const length = Math.max(1, Math.min(100, Number(customLength) || 75));
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.link} onPress={() => setRoute({ name: "start" })}>Back</Text>
        <Image source={coverFor("custom")} style={styles.rulesPhoto} />
        <Text style={styles.label}>Name</Text>
        <TextInput value={customName} onChangeText={setCustomName} style={styles.input} />
        <Text style={styles.label}>Length in days</Text>
        <TextInput value={customLength} onChangeText={setCustomLength} keyboardType="number-pad" style={styles.input} />
        <Text style={styles.label}>If you miss a day</Text>
        <View style={styles.pair}>
          <Pressable style={[styles.pairItem, customMiss === "restart" && styles.pairOn]} onPress={() => setCustomMiss("restart")}>
            <Text style={[styles.pairTitle, customMiss === "restart" && styles.pairTitleOn]}>Start over</Text>
            <Text style={[styles.pairLine, customMiss === "restart" && styles.pairLineOn]}>The count returns to day one.</Text>
          </Pressable>
          <Pressable style={[styles.pairItem, customMiss === "continue" && styles.pairOn]} onPress={() => setCustomMiss("continue")}>
            <Text style={[styles.pairTitle, customMiss === "continue" && styles.pairTitleOn]}>Keep going</Text>
            <Text style={[styles.pairLine, customMiss === "continue" && styles.pairLineOn]}>The miss is marked.</Text>
          </Pressable>
        </View>
        <Text style={styles.label}>Tasks</Text>
        {customTasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <Text style={styles.taskName}>{task.label}</Text>
            <Text style={styles.link} onPress={() => setCustomTasks((items) => items.filter((item) => item.id !== task.id))}>Remove</Text>
          </View>
        ))}
        <TextInput value={draftTask} onChangeText={setDraftTask} placeholder="Task name" placeholderTextColor="#8AA0B8" style={styles.input} />
        <TextInput value={draftDetail} onChangeText={setDraftDetail} placeholder="What done means" placeholderTextColor="#8AA0B8" style={styles.input} />
        <Text
          style={styles.link}
          onPress={() => {
            const label = draftTask.trim();
            if (!label) return;
            setCustomTasks((items) => [
              ...items,
              { id: `task-${items.length}-${label.slice(0, 8)}`, label, detail: draftDetail.trim() || "Done for the day.", image: "train" },
            ]);
            setDraftTask("");
            setDraftDetail("");
          }}
        >
          + Add a task
        </Text>
        <Text style={styles.note}>Saved as written, for all {length} days. These pictures on the tasks are prompts, not your days.</Text>
        <Pressable
          style={[styles.primary, customTasks.length === 0 && styles.disabled]}
          disabled={customTasks.length === 0}
          onPress={() => {
            const next = createJourney({
              program: "custom",
              name: customName.trim() || "Your own",
              timeZone: zone,
              today,
              length,
              missPolicy: customMiss,
              tasks: customTasks,
            });
            commit(next, { name: "app", tab: "today" });
          }}
        >
          <Text style={styles.primaryText}>Begin</Text>
        </Pressable>
      </ScrollView>
    );
  }

  if (!journey) {
    return <ScrollView contentContainerStyle={styles.screen}><Text style={styles.quiet}>Loading your journey…</Text></ScrollView>;
  }

  const attempt = route.name === "past"
    ? journey.attempts.find((item) => item.id === route.attemptId) ?? latestAttempt(journey)
    : activeAttempt(journey) ?? latestAttempt(journey);
  const number = dayNumber(attempt.startDate, today);
  const tasks = tasksForDay(journey.tasks, today, journey.recoveryWeekday);
  const record = attempt.days[today];
  const doneCount = tasks.filter((task) => record?.done[task.id]).length;
  const complete = todayTasksComplete(journey, today);

  if (route.name === "ended" || (route.name === "app" && attempt.status === "ended" && route.tab === "today")) {
    const ended = latestAttempt(journey);
    const endedNumber = ended.endedOn ? dayNumber(ended.startDate, ended.endedOn) : number;
    return (
      <View style={styles.fill}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Text style={styles.kicker}>{programName(journey.program, journey.name)}</Text>
          <Text style={styles.display}>This attempt{"\n"}ended.</Text>
          <Text style={styles.body}>
            It ended on day {endedNumber}{ended.endedOn ? `, ${prettyDate(ended.endedOn)}` : ""}. The days you kept are still here. A new attempt starts at day 1.
          </Text>
          <Pressable style={styles.primary} onPress={() => update((current) => beginAgain(current, today), { name: "app", tab: "today" })}>
            <Text style={styles.primaryText}>Begin again</Text>
          </Pressable>
          <Text style={styles.link} onPress={() => setRoute({ name: "past", attemptId: ended.id })}>See those days</Text>
        </ScrollView>
      </View>
    );
  }

  if (route.name === "finished" || attempt.status === "completed" && route.name === "app" && route.tab === "today") {
    return (
      <View style={styles.fill}>
        <ScrollView contentContainerStyle={styles.screen}>
          <Text style={styles.display}>Day {journey.length}{"\n"}completed</Text>
          <Text style={styles.body}>These {journey.length} days are finished. The pictures below are only the ones you added.</Text>
          <Pressable style={styles.primary} onPress={() => setRoute({ name: "share" })}>
            <Text style={styles.primaryText}>Share</Text>
          </Pressable>
          <Text style={styles.link} onPress={() => setRoute({ name: "app", tab: "journey" })}>See the days</Text>
        </ScrollView>
        <Dock tab="today" onToday={() => undefined} onJourney={() => setRoute({ name: "app", tab: "journey" })} />
      </View>
    );
  }

  if (route.name === "share") {
    const shareAttempt = activeAttempt(journey) ?? latestAttempt(journey);
    const shareNumber = Math.min(journey.length, Math.max(1, dayNumber(shareAttempt.startDate, today)));
    const selfie = shareAttempt.days[today]?.selfie ?? shareAttempt.days[endDate(shareAttempt.startDate, journey.length)]?.selfie;
    return (
      <ScrollView contentContainerStyle={styles.screen}>
        <Text style={styles.link} onPress={() => setRoute({ name: "app", tab: "today" })}>Close</Text>
        <View style={styles.shareCard}>
          <Text style={styles.kicker}>{programName(journey.program, journey.name)}</Text>
          <Text style={styles.huge}>Day {shareNumber}</Text>
          <Text style={styles.completed}>completed</Text>
          <Pressable style={styles.well} onPress={async () => {
            const image = await pickImage();
            if (!image) return;
            update((current) => setSelfie(current, today, image));
          }}>
            {selfie ? <Image source={{ uri: selfie }} style={styles.wellImage} /> : <Text style={styles.wellEmpty}>Add a selfie</Text>}
            <View style={styles.change}><Text style={styles.changeText}>{selfie ? "Change" : "Add"}</Text></View>
          </Pressable>
        </View>
        <Pressable
          style={styles.primary}
          onPress={async () => {
            try {
              const result = await shareDayCard({
                day: shareNumber,
                program: programName(journey.program, journey.name),
                selfie,
              });
              if (result === "downloaded") {
                Alert.alert("Picture saved", "This browser could not open the share sheet, so the picture downloaded instead.");
              }
            } catch {
              Alert.alert("Share did not finish", "Nothing was posted.");
            }
          }}
        >
          <Text style={styles.primaryText}>Share</Text>
        </Pressable>
        <Text style={styles.note}>Nothing is posted until you tap Share. Your private progress photo is not placed here unless you choose it.</Text>
      </ScrollView>
    );
  }

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={styles.docked}>
        {route.name === "past" || (route.name === "app" && route.tab === "journey") ? (
          <JourneyView
            journey={journey}
            attempt={attempt}
            today={today}
            onOpen={(date) => setViewDate(date)}
            onLeave={() => {
              Alert.alert("Leave this journey?", "This removes it from this app. It does not touch the older 75 Hard Tracker.", [
                { text: "Cancel", style: "cancel" },
                { text: "Leave", style: "destructive", onPress: () => commit(null, { name: "start" }) },
              ]);
            }}
            onOpenAttempt={(attemptId) => setRoute({ name: "past", attemptId })}
          />
        ) : (
          <TodayView
            journey={journey}
            tasks={tasks}
            record={record}
            number={Math.max(1, number)}
            today={today}
            doneCount={doneCount}
            complete={complete}
            onToggle={(taskId) => update((current) => toggleTask(current, today, taskId))}
            onAddPhoto={async () => {
              const image = await pickImage();
              if (!image) return;
              update((current) => {
                let next = setDayPhoto(current, today, image);
                const live = activeAttempt(next);
                if (next.tasks.some((task) => task.id === "photo") && !live?.days[today]?.done.photo) {
                  next = toggleTask(next, today, "photo");
                }
                return next;
              });
            }}
            onShare={() => setRoute({ name: "share" })}
            onMiss={() => {
              Alert.alert("End today?", "This attempt will end, and the days you kept will stay.", [
                { text: "Cancel", style: "cancel" },
                { text: "End attempt", style: "destructive", onPress: () => update((current) => missToday(current, today), { name: "ended" }) },
              ]);
            }}
          />
        )}
      </ScrollView>
      {viewDate ? (
        <DaySheet
          journey={journey}
          attempt={attempt}
          date={viewDate}
          onClose={() => setViewDate(null)}
        />
      ) : null}
      <Dock
        tab={route.name === "app" && route.tab === "journey" || route.name === "past" ? "journey" : "today"}
        onToday={() => setRoute(attempt.status === "ended" ? { name: "ended" } : attempt.status === "completed" ? { name: "finished" } : { name: "app", tab: "today" })}
        onJourney={() => setRoute({ name: "app", tab: "journey" })}
      />
    </View>
  );
}

function openingRoute(journey: Journey): Route {
  if (activeAttempt(journey)) return { name: "app", tab: "today" };
  if (latestAttempt(journey).status === "ended") return { name: "ended" };
  return { name: "finished" };
}

function Choice(props: {
  source: ImageSourcePropType;
  chip: string;
  chipStyle: object;
  title: string;
  line: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.choice} onPress={props.onPress}>
      <Image source={props.source} style={styles.choiceImage} />
      <View style={styles.shade} />
      <Text style={[styles.chip, props.chipStyle]}>{props.chip}</Text>
      <View style={styles.choiceCopy}>
        <Text style={styles.choiceTitle}>{props.title}</Text>
        <Text style={styles.choiceLine}>{props.line}</Text>
      </View>
    </Pressable>
  );
}

function HardRules() {
  return (
    <View>
      <Rule title="Two workouts" body="Each one is at least 45 minutes, continuous, and at least 3 hours apart. One is outdoors and uncovered. Both can be outdoors." />
      <Rule title="A diet" body="You pick it. No alcohol and no cheat meals." />
      <Rule title="One gallon of water" body="Plain, still, and unflavored. A US gallon is about 3.8 liters. Additives do not count." />
      <Rule title="10 pages" body="A physical nonfiction book: personal development, business, or your work. Audiobooks do not count. Finish a book before the next one." />
      <Rule title="A progress photo" body="For you. It is not posted, and it shows on the journey only if you add it here." />
    </View>
  );
}

function SoftRules(props: { recoveryDay: number; onChange: (day: number) => void }) {
  return (
    <View>
      <Rule title="Eat well" body="Alcohol only on a social occasion." />
      <Rule title="45 minutes a day" body="No full day off. One day each week is active recovery: still 45 minutes, easier movement." />
      <Text style={styles.label}>Recovery day</Text>
      <View style={styles.days}>
        {WEEKDAYS.map((label, index) => (
          <Pressable key={label} style={[styles.dayChip, props.recoveryDay === index && styles.dayChipOn]} onPress={() => props.onChange(index)}>
            <Text style={[styles.dayChipText, props.recoveryDay === index && styles.dayChipTextOn]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Rule title="3 liters of water" body="About 0.8 gallons. This is not 75 Hard’s gallon." />
      <Rule title="10 pages" body="Any book." />
    </View>
  );
}

function Rule(props: { title: string; body: string }) {
  return (
    <View style={styles.rule}>
      <Text style={styles.ruleTitle}>{props.title}</Text>
      <Text style={styles.body}>{props.body}</Text>
    </View>
  );
}

function TodayView(props: {
  journey: Journey;
  tasks: TaskDef[];
  record: DayRecord | undefined;
  number: number;
  today: string;
  doneCount: number;
  complete: boolean;
  onToggle: (id: string) => void;
  onAddPhoto: () => void;
  onShare: () => void;
  onMiss: () => void;
}) {
  return (
    <View>
      <View style={styles.dayHead}>
        <Text style={styles.dayNumber}>Day {props.number}</Text>
        <Text style={styles.quiet}>{prettyDate(props.today)}</Text>
      </View>
      <View style={styles.dashes}>
        {props.tasks.map((task, index) => <View key={task.id} style={[styles.dash, index < props.doneCount && styles.dashOn]} />)}
      </View>
      <View style={styles.grid}>
        {props.tasks.map((task) => {
          const done = props.record?.done[task.id] === true;
          const ownPhoto = task.id === "photo" ? props.record?.photo : undefined;
          return (
            <Pressable key={task.id} style={styles.card} onPress={() => props.onToggle(task.id)}>
              <Image source={ownPhoto ? { uri: ownPhoto } : promptSource(task.image)} style={styles.cardImage} />
              <View style={styles.cardShade} />
              <View style={[styles.badge, done ? styles.badgeOn : styles.badgeOff]}>
                <Text style={[styles.badgeMark, done && styles.badgeMarkOn]}>{done ? "✓" : "+"}</Text>
              </View>
              <Text style={styles.cardLabel}>{task.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {props.journey.tasks.some((task) => task.id === "photo") ? (
        <Text style={styles.link} onPress={props.onAddPhoto}>Add today’s private photo</Text>
      ) : (
        <Text style={styles.link} onPress={props.onAddPhoto}>Add a photo for today</Text>
      )}
      <Text style={styles.note}>The pictures on the tasks show what the task is. Your journey only keeps a photo you add.</Text>
      {props.complete ? (
        <Pressable style={styles.primary} onPress={props.onShare}><Text style={styles.primaryText}>Share this day</Text></Pressable>
      ) : null}
      {props.journey.missPolicy === "restart" ? (
        <Text style={styles.danger} onPress={props.onMiss}>I missed today</Text>
      ) : null}
    </View>
  );
}

function JourneyView(props: {
  journey: Journey;
  attempt: Attempt;
  today: string;
  onOpen: (date: string) => void;
  onLeave: () => void;
  onOpenAttempt: (id: string) => void;
}) {
  const last = endDate(props.attempt.startDate, props.journey.length);
  const cells: string[] = [];
  let cursor = props.attempt.startDate;
  while (cursor <= last) {
    cells.push(cursor);
    cursor = addDays(cursor, 1);
  }
  const heroPhoto = props.attempt.days[props.today]?.photo;
  const showingToday = props.today >= props.attempt.startDate && props.today <= last && props.attempt.status === "active";
  const heroNumber = showingToday ? dayNumber(props.attempt.startDate, props.today) : 1;
  return (
    <View>
      <View style={styles.hero}>
        <Image source={heroPhoto ? { uri: heroPhoto } : coverFor(props.journey.program)} style={styles.heroImage} />
        <View style={styles.shade} />
        <View style={styles.heroCopy}>
          <Text style={styles.heroKicker}>{programName(props.journey.program, props.journey.name)}</Text>
          <Text style={styles.heroDay}>Day {showingToday ? heroNumber : dayNumber(props.attempt.startDate, props.attempt.endedOn ?? props.attempt.startDate)}</Text>
          <Text style={styles.heroDate}>{showingToday ? prettyDate(props.today) : `Started ${prettyDate(props.attempt.startDate)}`}</Text>
        </View>
      </View>
      <Text style={styles.section}>This attempt</Text>
      <View style={styles.cells}>
        {cells.map((date) => {
          const n = dayNumber(props.attempt.startDate, date);
          const future = date > props.today || (props.attempt.endedOn ? date > props.attempt.endedOn : false);
          const photo = props.attempt.days[date]?.photo;
          const complete = isDayComplete(props.journey.tasks.map((task) => task.id), props.attempt.days[date]);
          const broken = props.attempt.endedOn === date;
          const missed = broken || (!future && date < props.today && !complete);
          return (
            <Pressable key={date} style={styles.cellWrap} onPress={() => { if (!future && date >= props.attempt.startDate && date <= props.today) props.onOpen(date); }}>
              {photo && !future ? (
                <View style={styles.cellPhotoWrap}>
                  <Image source={{ uri: photo }} style={styles.cellPhoto} />
                  <Text style={styles.photoIndex}>{n}</Text>
                </View>
              ) : (
                <View style={[
                  styles.cell,
                  complete && styles.cellDone,
                  date === props.today && !complete && styles.cellToday,
                  missed && styles.cellMiss,
                ]}>
                  <Text style={[styles.cellText, complete && styles.cellTextOn, missed && styles.cellMissText]}>{n}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.note}>A square stays a number until you add a photo for that day. These are not sample pictures.</Text>
      {props.journey.attempts.filter((item) => item.id !== props.attempt.id).map((item, index) => (
        <Text key={item.id} style={styles.link} onPress={() => props.onOpenAttempt(item.id)}>
          Attempt {index + 1}, {item.status}{item.endedOn ? ` on day ${dayNumber(item.startDate, item.endedOn)}` : ""}
        </Text>
      ))}
      <Text style={styles.danger} onPress={props.onLeave}>Leave this journey</Text>
    </View>
  );
}

function DaySheet(props: { journey: Journey; attempt: Attempt; date: string; onClose: () => void }) {
  const tasks = tasksForDay(props.journey.tasks, props.date, props.journey.recoveryWeekday);
  const record = props.attempt.days[props.date];
  return (
    <View style={styles.sheetWrap}>
      <Pressable style={styles.sheetBackdrop} onPress={props.onClose} />
      <View style={styles.sheet}>
        <Text style={styles.ruleTitle}>Day {dayNumber(props.attempt.startDate, props.date)}</Text>
        <Text style={styles.quiet}>{prettyDate(props.date)} · {weekdayIndex(props.date) === props.journey.recoveryWeekday ? "Recovery day" : "Read only"}</Text>
        {tasks.map((task) => (
          <Text key={task.id} style={styles.body}>{record?.done[task.id] ? "Done" : "Not done"} · {task.label}</Text>
        ))}
        <Text style={styles.link} onPress={props.onClose}>Close</Text>
      </View>
    </View>
  );
}

function Dock(props: { tab: "today" | "journey"; onToday: () => void; onJourney: () => void }) {
  return (
    <View style={styles.dock}>
      <Pressable onPress={props.onToday} style={[styles.dockItem, props.tab === "today" && styles.dockOn]}>
        <Text style={[styles.dockText, props.tab === "today" && styles.dockTextOn]}>Today</Text>
      </Pressable>
      <Pressable onPress={props.onJourney} style={[styles.dockItem, props.tab === "journey" && styles.dockOn]}>
        <Text style={[styles.dockText, props.tab === "journey" && styles.dockTextOn]}>Journey</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#FFFFFF" },
  screen: { padding: 16, paddingTop: 28, paddingBottom: 40, backgroundColor: "#FFFFFF" },
  docked: { padding: 16, paddingTop: 28, paddingBottom: 220, backgroundColor: "#FFFFFF" },
  display: { fontFamily: "Bricolage", fontSize: 34, lineHeight: 36, color: "#102033", marginBottom: 12 },
  huge: { fontFamily: "Bricolage", fontSize: 64, lineHeight: 64, color: "#102033" },
  completed: { fontFamily: "Bricolage", fontSize: 32, color: "#007AFF", marginBottom: 12 },
  dayNumber: { fontFamily: "Bricolage", fontSize: 40, color: "#007AFF" },
  body: { fontFamily: "Inter", fontSize: 15, lineHeight: 21, color: "#102033", marginBottom: 8 },
  quiet: { fontFamily: "Inter", fontSize: 14, color: "#5C6E86" },
  note: { fontFamily: "Inter", fontSize: 13, lineHeight: 18, color: "#5C6E86", marginVertical: 8 },
  label: { fontFamily: "Inter-Medium", fontSize: 13, color: "#007AFF", marginTop: 12, marginBottom: 6 },
  link: { fontFamily: "Inter-Medium", fontSize: 16, color: "#007AFF", marginVertical: 8 },
  danger: { fontFamily: "Inter-Medium", fontSize: 15, color: "#FF4D6A", marginVertical: 12 },
  kicker: { fontFamily: "Inter-Medium", fontSize: 13, color: "#007AFF", letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  choice: { height: 168, borderRadius: 22, overflow: "hidden", marginBottom: 10 },
  choiceImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  shade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(8,24,58,0.28)" },
  chip: { position: "absolute", top: 12, left: 12, overflow: "hidden", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, fontFamily: "Inter-Medium", fontSize: 12 },
  chipBlue: { backgroundColor: "#007AFF", color: "#FFFFFF" },
  chipSun: { backgroundColor: "#FFD60A", color: "#102033" },
  chipCoral: { backgroundColor: "#FF4D6A", color: "#FFFFFF" },
  choiceCopy: { position: "absolute", left: 14, right: 14, bottom: 12 },
  choiceTitle: { fontFamily: "Bricolage", fontSize: 28, color: "#FFFFFF" },
  choiceLine: { fontFamily: "Inter", fontSize: 14, color: "#FFFFFF" },
  rulesPhoto: { height: 180, width: "100%", borderRadius: 22, marginVertical: 12 },
  rule: { marginBottom: 8 },
  ruleTitle: { fontFamily: "Inter-Medium", fontSize: 16, color: "#102033" },
  days: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  dayChip: { borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#E8F2FF" },
  dayChipOn: { backgroundColor: "#007AFF" },
  dayChipText: { fontFamily: "Inter-Medium", color: "#007AFF", fontSize: 13 },
  dayChipTextOn: { color: "#FFFFFF" },
  input: { borderBottomWidth: 1, borderBottomColor: "#102033", fontFamily: "Bricolage", fontSize: 22, color: "#102033", paddingVertical: 6, marginBottom: 8 },
  pair: { flexDirection: "row", gap: 8 },
  pairItem: { flex: 1, borderRadius: 16, padding: 10, backgroundColor: "#F3F8FF" },
  pairOn: { backgroundColor: "#007AFF" },
  pairTitle: { fontFamily: "Inter-Medium", fontSize: 15, color: "#102033" },
  pairTitleOn: { color: "#FFFFFF" },
  pairLine: { fontFamily: "Inter", fontSize: 12, color: "#5C6E86", marginTop: 2 },
  pairLineOn: { color: "#E8F2FF" },
  taskRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  taskName: { fontFamily: "Inter-Medium", fontSize: 16, color: "#102033", flex: 1 },
  primary: { backgroundColor: "#007AFF", borderRadius: 27, minHeight: 52, alignItems: "center", justifyContent: "center", marginTop: 12 },
  primaryText: { fontFamily: "Inter-Medium", color: "#FFFFFF", fontSize: 17 },
  disabled: { opacity: 0.4 },
  dayHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  dashes: { flexDirection: "row", gap: 6, marginVertical: 10 },
  dash: { width: 22, height: 6, borderRadius: 99, backgroundColor: "#E8F2FF" },
  dashOn: { backgroundColor: "#007AFF" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: { width: "48%", height: 150, borderRadius: 18, overflow: "hidden", marginBottom: 10 },
  cardImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  cardShade: { position: "absolute", left: 0, right: 0, bottom: 0, height: 64, backgroundColor: "rgba(8,24,58,0.45)" },
  badge: { position: "absolute", top: 8, right: 8, width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  badgeOn: { backgroundColor: "#007AFF" },
  badgeOff: { backgroundColor: "rgba(255,255,255,0.82)" },
  badgeMark: { color: "#007AFF", fontSize: 16, fontFamily: "Inter-Medium" },
  badgeMarkOn: { color: "#FFFFFF" },
  cardLabel: { position: "absolute", left: 10, right: 10, bottom: 8, color: "#FFFFFF", fontFamily: "Bricolage", fontSize: 16 },
  hero: { height: 200, borderRadius: 26, overflow: "hidden", marginBottom: 8 },
  heroImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  heroCopy: { position: "absolute", left: 16, bottom: 14 },
  heroKicker: { color: "#FFFFFF", fontFamily: "Inter-Medium", fontSize: 12, letterSpacing: 1 },
  heroDay: { color: "#FFFFFF", fontFamily: "Bricolage", fontSize: 42 },
  heroDate: { color: "#FFFFFF", fontFamily: "Inter", fontSize: 14 },
  section: { fontFamily: "Inter-Medium", color: "#007AFF", marginTop: 8, marginBottom: 8 },
  cells: { flexDirection: "row", flexWrap: "wrap" },
  cellWrap: { width: "14.28%", aspectRatio: 1, padding: 2 },
  cell: { flex: 1, borderRadius: 8, backgroundColor: "#E8F2FF", alignItems: "center", justifyContent: "center" },
  cellDone: { backgroundColor: "#007AFF" },
  cellToday: { backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#007AFF" },
  cellMiss: { backgroundColor: "#FFFFFF" },
  cellText: { fontFamily: "Inter-Medium", fontSize: 11, color: "#007AFF" },
  cellTextOn: { color: "#FFFFFF" },
  cellMissText: { color: "#FF4D6A" },
  cellPhotoWrap: { flex: 1, borderRadius: 8, overflow: "hidden" },
  cellPhoto: { width: "100%", height: "100%" },
  photoIndex: { position: "absolute", left: 3, bottom: 1, color: "#FFFFFF", fontSize: 10, fontFamily: "Inter-Medium" },
  dock: { position: "absolute", alignSelf: "center", bottom: 18, flexDirection: "row", backgroundColor: "rgba(255,255,255,0.86)", borderRadius: 999, padding: 4, gap: 4, borderWidth: 1, borderColor: "rgba(255,255,255,0.9)" },
  dockItem: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999 },
  dockOn: { backgroundColor: "#007AFF" },
  dockText: { fontFamily: "Inter-Medium", color: "#007AFF", fontSize: 15 },
  dockTextOn: { color: "#FFFFFF" },
  shareCard: { borderRadius: 28, borderWidth: 1, borderColor: "#E6F0FF", padding: 16, marginTop: 8 },
  well: { marginTop: 12, height: 320, borderRadius: 24, overflow: "hidden", backgroundColor: "#E8F2FF", alignItems: "center", justifyContent: "center" },
  wellImage: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  wellEmpty: { fontFamily: "Inter-Medium", color: "#007AFF", fontSize: 16 },
  change: { position: "absolute", right: 10, bottom: 10, backgroundColor: "rgba(255,255,255,0.86)", borderRadius: 99, paddingHorizontal: 12, paddingVertical: 6 },
  changeText: { fontFamily: "Inter-Medium", color: "#102033" },
  sheetWrap: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(16,32,51,0.28)" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, paddingBottom: 28 },
});
