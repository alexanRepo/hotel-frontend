import { CatalogField } from '../catalog/catalog.fields';
export const huespedesFields: CatalogField[] = [
  { key: 'nombres', label: 'Nombres', type: 'text', max: 100, required: true },
  { key: 'apellidos', label: 'Apellidos', type: 'text', max: 100, required: true },
  {
    key: 'tipoDocumento',
    label: 'Tipo de documento',
    type: 'select',
    options: ['DNI', 'CE', 'PASAPORTE'],
    required: true,
  },
  { key: 'documento', label: 'Documento', type: 'text', max: 20, required: true },
  { key: 'telefono', label: 'Teléfono', type: 'text', max: 20 },
  { key: 'correo', label: 'Correo', type: 'email', max: 150 },
];
