export interface SelectOption<T extends string | number> {
  label: string;
  value: T;
}

export interface SelectProps<T extends string | number> {
  options: SelectOption<T>[];
  value: T | T[] | null;
  onChange: (value: T | T[]) => void;
  label?: string;
  placeholder?: string;
  isSearchable?: boolean;
  isMulti?: boolean;
  error?: string;
  disabled?: boolean;
}
