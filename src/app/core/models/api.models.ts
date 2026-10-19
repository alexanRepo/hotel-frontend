export type Rol = 'ADMIN' | 'RECEPCIONISTA';
export type Documento = 'DNI' | 'CE' | 'PASAPORTE';
export type EstadoHabitacion = 'HABILITADA' | 'LIMPIEZA' | 'MANTENIMIENTO';
export type EstadoReserva =
  'CONFIRMADA' | 'EN_ESTADIA' | 'FINALIZADA' | 'CANCELADA' | 'NO_PRESENTADO';
export type Medio = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TRANSFERENCIA' | 'TARJETA';
export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}
export type Query = Record<string, string | number | boolean | undefined | null>;
export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  activo: boolean;
}
export interface Login {
  token: string;
  tipoToken: string;
  expiresIn: number;
  usuario: Usuario;
}
export interface UsuarioRequest {
  nombre: string;
  correo: string;
  password: string;
  rol: Rol;
}
export interface HuespedRequest {
  nombres: string;
  apellidos: string;
  tipoDocumento: Documento;
  documento: string;
  telefono: string | null;
  correo: string | null;
}
export interface Huesped extends HuespedRequest {
  id: number;
  activo: boolean;
  creado: string;
  actualizado: string;
}
export interface TipoRequest {
  nombre: string;
  descripcion: string | null;
  capacidad: number;
  tarifa: number;
}
export interface Tipo extends TipoRequest {
  id: number;
  activo: boolean;
}
export interface HabitacionRequest {
  numero: string;
  piso: number;
  tipoId: number;
}
export interface Habitacion {
  id: number;
  numero: string;
  piso: number;
  tipo: Tipo;
  activo: boolean;
  estado: EstadoHabitacion;
}
export interface ServicioRequest {
  nombre: string;
  precio: number;
}
export interface Servicio extends ServicioRequest {
  id: number;
  activo: boolean;
}
export interface Titular {
  nombres: string;
  apellidos: string;
  tipoDocumento: string;
  documento: string;
  telefono: string | null;
  correo: string | null;
}
export interface ReservaRequest {
  huespedId: number;
  habitacionId: number;
  entrada: string;
  salida: string;
  personas: number;
  observaciones: string | null;
}
export interface Reprogramar {
  habitacionId: number;
  entrada: string;
  salida: string;
  personas: number;
}
export interface Reserva {
  id: number;
  codigo: string;
  huespedId: number;
  habitacionId: number;
  numeroHabitacion: string;
  titular: Titular;
  entrada: string;
  salida: string;
  personas: number;
  noches: number;
  tarifa: number;
  alojamiento: number;
  estado: EstadoReserva;
  observaciones: string | null;
  creadorId: number;
  creado: string;
}
export interface Estadia {
  id: number;
  checkIn: string;
  checkOut: string | null;
  usuarioEntradaId: number;
  usuarioSalidaId: number | null;
}
export interface Consumo {
  id: number;
  servicioId: number;
  nombre: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  anulado: boolean;
  motivoAnulacion: string | null;
  creado: string;
  anuladoEn: string | null;
  usuarioId: number;
  anuladoPorId: number | null;
}
export interface PagoRequest {
  claveOperacion: string;
  monto: number;
  medio: Medio;
  referencia: string | null;
}
export interface Pago {
  id: number;
  claveOperacion: string;
  monto: number;
  medio: Medio;
  referencia: string | null;
  anulado: boolean;
  motivoAnulacion: string | null;
  creado: string;
  anuladoEn: string | null;
  usuarioId: number;
  anuladoPorId: number | null;
}
export interface DevolucionRequest {
  claveOperacion: string;
  monto: number;
  motivo: string;
}
export interface Devolucion {
  id: number;
  pagoId: number;
  claveOperacion: string;
  monto: number;
  motivo: string;
  creado: string;
  usuarioId: number;
}
export interface Financiero {
  alojamiento: number;
  consumos: number;
  total: number;
  pagosVigentes: number;
  devoluciones: number;
  netoCobrado: number;
  saldoPendiente: number;
  moneda: string;
}
export interface Detalle {
  reserva: Reserva;
  estadia: Estadia | null;
  consumos: Consumo[];
  pagos: Pago[];
  devoluciones: Devolucion[];
  financiero: Financiero;
}
export interface Ocupacion {
  habitacionesActivas: number;
  ocupadas: number;
  limpieza: number;
  mantenimiento: number;
}
export interface Agenda {
  entradas: Reserva[];
  salidas: Reserva[];
}
export interface Grupo {
  grupo: string;
  cantidad: number;
  importe: number;
}
export interface Caja {
  cobros: number;
  devoluciones: number;
  neto: number;
}
export interface Saldo {
  reservaId: number;
  codigo: string;
  estado: EstadoReserva;
  total: number;
  netoCobrado: number;
  saldo: number;
}
