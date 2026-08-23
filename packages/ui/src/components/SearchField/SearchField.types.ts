/** Density mode — expressive is the brand's roomy default, functional the dense working set. */
export type SearchFieldDensity = 'expressive' | 'functional';

export interface SearchFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  density?: SearchFieldDensity;
  /** Shows a clear button once there's a value. */
  onClear?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}
