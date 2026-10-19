import { CatalogField } from '../catalog/catalog.fields';
export const serviciosFields: CatalogField[] = [
  { key: 'nombre', label: 'Nombre', type: 'text', max: 100, required: true },
  { key: 'precio', label: 'Precio (S/)', type: 'money', required: true },
];
