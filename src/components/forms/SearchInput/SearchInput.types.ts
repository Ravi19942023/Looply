export interface SearchInputProps {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  loading?: boolean;
  onValueChange?: (value: string) => void;
}
