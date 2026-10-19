import { CatalogField } from '../catalog/catalog.fields';
export const habitacionesFields: CatalogField[] = [
  { key: 'numero', label: 'Número', type: 'text', max: 15, required: true },
  { key: 'piso', label: 'Piso', type: 'number', required: true },
  { key: 'tipoId', label: 'Tipo de habitación', type: 'lookup', required: true },
];
