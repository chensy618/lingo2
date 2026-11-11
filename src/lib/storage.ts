"use client";

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Attempt, Preferences, SelfRating, VocabStatus } from "./types";

export const STORAGE_KEYS = {
  preferences: "lingo2.preferences.v1",
  attempts: "lingo2.attempts.v1",
  vocab: "lingo2.vocab.v1",
  bookmarks: "lingo2.bookmarks.v1",
  lastSession: "lingo2.last-session.v1",
};

export const DEFAULT_PREFERENCES: Preferences = {
  target: "no",
  source: "zh",
  level: "A1",
  track: "everyday",
  sessionSize: 10,
  dailyGoal: 10,
  showThird: true,
  uiLanguage: "zh",
  profileLevels: { en: "B2", no: "A1", zh: "C2" },
};

export interface LastSession {
  target: string;
  source: string;
  level: string;
  track: string;
  exerciseId: string;
  at: string;
}

interface StoreEntry<T> {
  listeners: Set<() => void>;
  raw: string | null | undefined;
  value: T;
}

const registry = new Map<string, StoreEntry<unknown>>();

function getEntry<T>(key: string, initial: T): StoreEntry<T> {
  let entry = registry.get(key) as StoreEntry<T> | undefined;
  if (!entry) {
    entry = { listeners: new Set(), raw: undefined, value: initial };
    registry.set(key, entry as StoreEntry<unknown>);
  }
  return entry;
}

function readRaw(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function getSnapshot<T>(key: string, initial: T): T {
  const entry = getEntry(key, initial);
  const raw = readRaw(key);
  if (entry.raw === raw) return entry.value;
  entry.raw = raw;
  entry.value = parse(raw, initial);
  return entry.value;
}

function writeSnapshot<T>(key: string, initial: T, next: SetStateAction<T>) {
  const entry = getEntry(key, initial);
  const previous = getSnapshot(key, initial);
  const value =
    typeof next === "function" ? (next as (prev: T) => T)(previous) : next;
  const raw = JSON.stringify(value);
  try {
    window.localStorage.setItem(key, raw);
  } catch {
    // ignore quota errors
  }
  entry.raw = raw;
  entry.value = value;
  for (const listener of entry.listeners) listener();
}

const noopSubscribe = () => () => {};

export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function useStoredState<T>(key: string, initial: T) {
  const initialRef = useRef(initial);

  const subscribe = useCallback(
    (listener: () => void) => {
      const entry = getEntry(key, initialRef.current);
      entry.listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) {
          entry.raw = undefined;
          listener();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        entry.listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    [key],
  );

  const value = useSyncExternalStore(
    subscribe,
    () => getSnapshot(key, initialRef.current),
    () => initialRef.current,
  );

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (next) => writeSnapshot(key, initialRef.current, next),
    [key],
  );

  return [value, setValue] as const;
}

export function usePreferences() {
  const [stored, setStored] = useStoredState<Preferences>(
    STORAGE_KEYS.preferences,
    DEFAULT_PREFERENCES,
  );
  const hydrated = useHydrated();

  const preferences: Preferences = useMemo(
    () => ({
      ...DEFAULT_PREFERENCES,
      ...stored,
      profileLevels: {
        ...DEFAULT_PREFERENCES.profileLevels,
        ...(stored.profileLevels ?? {}),
      },
    }),
    [stored],
  );

  return [preferences, setStored, hydrated] as const;
}

export function useAttempts() {
  return useStoredState<Attempt[]>(STORAGE_KEYS.attempts, []);
}

export function useVocabState() {
  return useStoredState<Record<string, VocabStatus>>(STORAGE_KEYS.vocab, {});
}

export function useBookmarks() {
  return useStoredState<string[]>(STORAGE_KEYS.bookmarks, []);
}

export function buildAttempt(input: {
  exerciseId: string;
  target: Attempt["target"];
  source: Attempt["source"];
  level: Attempt["level"];
  track: Attempt["track"];
  answer: string;
  selfRating: SelfRating;
  similarity: number;
}): Attempt {
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    exerciseId: input.exerciseId,
    target: input.target,
    source: input.source,
    level: input.level,
    track: input.track,
    answer: input.answer,
    selfRating: input.selfRating,
    similarity: Number(input.similarity.toFixed(3)),
    createdAt: new Date().toISOString(),
  };
}

export function streakFromAttempts(attempts: Attempt[]) {
  if (!attempts.length) return 0;
  const days = new Set(
    attempts.map((attempt) => {
      const date = new Date(attempt.createdAt);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    }),
  );

  let streak = 0;
  const cursor = new Date();
  const today = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;

  if (!days.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (;;) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function attemptsToday(attempts: Attempt[]) {
  const now = new Date();
  return attempts.filter((attempt) => {
    const date = new Date(attempt.createdAt);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }).length;
}

export function dueReview(attempts: Attempt[]) {
  const latestByExercise = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const existing = latestByExercise.get(attempt.exerciseId);
    if (!existing || new Date(attempt.createdAt) > new Date(existing.createdAt)) {
      latestByExercise.set(attempt.exerciseId, attempt);
    }
  }
  return Array.from(latestByExercise.values())
    .filter((attempt) => attempt.selfRating !== "good")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
