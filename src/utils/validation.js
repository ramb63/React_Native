export function validateReserva(form) {
  if (!form.cliente?.trim()) return 'El cliente es obligatorio.';
  const cancha = Number(form.cancha);
  if (![1, 2].includes(cancha)) return 'La cancha debe ser 1 o 2.';
  if (!form.fecha?.trim()) return 'La fecha es obligatoria.';
  if (!form.horaInicio || !form.horaFin) return 'Debes indicar el horario completo.';
  if (toMinutes(form.horaFin) <= toMinutes(form.horaInicio)) return 'La hora final debe ser posterior a la inicial.';
  return null;
}

export function toMinutes(value) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}
