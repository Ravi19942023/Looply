export interface FileInputProps {
  label: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFilesChange?: (files: FileList | null) => void;
}
