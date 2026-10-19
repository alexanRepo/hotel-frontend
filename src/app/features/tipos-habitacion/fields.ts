import { CatalogField } from '../catalog/catalog.fields';
export const tiposHabitacionFields: CatalogField[] = [
  { key: 'nombre', label: 'Nombre', type: 'text', max: 80, required: true },
  { key: 'descripcion', label: 'Descripción', type: 'text', max: 500 },
  { key: 'capacidad', label: 'Capacidad', type: 'number', required: true },
  { key: 'tarifa', label: 'Tarifa por noche (S/)', type: 'money', required: true },
];
