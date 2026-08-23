export interface FieldModeToggleProps {
  label?: string;
  /** Says what the mode does to the interface. Omit only if the surrounding copy already does. */
  hint?: string;
}

/** `const [on, setOn] = useFieldMode()` — the shared store's answer and the one route to change it. */
export type FieldModeHook = [boolean, (on: boolean) => void];
