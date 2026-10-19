import { CatalogField } from '../catalog/catalog.fields';
export const usuariosFields: CatalogField[] = [
  { key: 'nombre', label: 'Nombre', type: 'text', max: 100, required: true },
  { key: 'correo', label: 'Correo', type: 'email', max: 150, required: true },
  { key: 'password', label: 'Contraseña inicial', type: 'password', required: true },
  {
    key: 'rol',
    label: 'Rol',
    type: 'select',
    options: ['ADMIN', 'RECEPCIONISTA'],
    required: true,
  },
];
