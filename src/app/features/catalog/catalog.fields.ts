export interface CatalogField {
  key: string;
  label: string;
  type: string;
  max?: number;
  required?: boolean;
  options?: string[];
}
