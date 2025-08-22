// Copyright (c) 2025 Apple Inc. Licensed under MIT License.

import { derived, writable } from "svelte/store";

let matcher = typeof window !== "undefined" ? window.matchMedia?.("(prefers-color-scheme: dark)") : null;

let systemDarkMode = writable<boolean>(matcher?.matches ?? false);
matcher?.addEventListener("change", (event) => {
  systemDarkMode.set(event.matches);
});

export { systemDarkMode };

export function makeDarkModeStore() {
  let userDarkMode = writable<boolean | null>(null);
  let darkMode = derived([systemDarkMode, userDarkMode], ([system, user]) => user ?? system);
  return { darkMode, userDarkMode };
}
