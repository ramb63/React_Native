const reservasIniciales = [
  {
    id: 'res-1',
    cliente: 'Andrés',
    cancha: 1,
    fecha: '2026-09-10',
    horaInicio: '20:00',
    horaFin: '21:00',
    estado: 'Pendiente',
    anticipo: 0,
    tipoCliente: 'Normal',
    observaciones: 'Te pago al llegar',
    createdAt: '2026-09-06T09:00:00.000Z'
  },
  {
    id: 'res-2',
    cliente: 'Empresa Luma',
    cancha: 1,
    fecha: '2026-09-10',
    horaInicio: '19:30',
    horaFin: '21:30',
    estado: 'Confirmada',
    anticipo: 150,
    tipoCliente: 'Empresa',
    observaciones: 'Reserva fija por anticipo semanal',
    createdAt: '2026-09-05T11:00:00.000Z'
  }
];

const reservas = [...reservasIniciales];

function convertirHoraAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function existeConflicto(nuevaReserva, reservaExistente) {
  if (nuevaReserva.cancha !== reservaExistente.cancha) return false;
  if (nuevaReserva.fecha !== reservaExistente.fecha) return false;

  const inicioNueva = convertirHoraAMinutos(nuevaReserva.horaInicio);
  const finNueva = convertirHoraAMinutos(nuevaReserva.horaFin);
  const inicioExistente = convertirHoraAMinutos(reservaExistente.horaInicio);
  const finExistente = convertirHoraAMinutos(reservaExistente.horaFin);

  const hayCruce = inicioNueva < finExistente && finNueva > inicioExistente;

  return hayCruce && ['Confirmada', 'Pendiente'].includes(reservaExistente.estado);
}

function validarReserva(reserva) {
  if (!reserva.cliente || !reserva.cliente.trim()) {
    return 'El cliente es obligatorio.';
  }

  if (!Number.isInteger(reserva.cancha) || !(reserva.cancha === 1 || reserva.cancha === 2)) {
    return 'La cancha debe ser 1 o 2.';
  }

  if (!reserva.fecha) {
    return 'La fecha es obligatoria.';
  }

  if (!reserva.horaInicio || !reserva.horaFin) {
    return 'Debe indicar hora de inicio y finalización.';
  }

  const inicio = convertirHoraAMinutos(reserva.horaInicio);
  const fin = convertirHoraAMinutos(reserva.horaFin);

  if (fin <= inicio) {
    return 'La hora final debe ser posterior a la hora inicial.';
  }

  if (reserva.estado && !['Pendiente', 'Confirmada', 'Liberada', 'Cancelada', 'Finalizada'].includes(reserva.estado)) {
    return 'El estado no es válido.';
  }

  const conflicto = reservas.find((item) => {
    if (item.id === reserva.id) return false;
    return existeConflicto(reserva, item);
  });

  if (conflicto) {
    return `No se puede reservar la Cancha ${reserva.cancha} de ${reserva.horaInicio} a ${reserva.horaFin} porque existe una reserva de ${conflicto.horaInicio} a ${conflicto.horaFin}.`;
  }

  return null;
}

function getReservas() {
  return [...reservas];
}

function getReservaPorId(id) {
  return reservas.find((item) => item.id === id) || null;
}

function createReserva(data) {
  const nuevaReserva = {
    id: `res-${Date.now()}`,
    cliente: data.cliente,
    cancha: Number(data.cancha),
    fecha: data.fecha,
    horaInicio: data.horaInicio,
    horaFin: data.horaFin,
    estado: data.estado || 'Pendiente',
    anticipo: Number(data.anticipo || 0),
    tipoCliente: data.tipoCliente || 'Normal',
    observaciones: data.observaciones || '',
    createdAt: new Date().toISOString()
  };

  const error = validarReserva(nuevaReserva);
  if (error) {
    return { ok: false, error };
  }

  reservas.push(nuevaReserva);
  return { ok: true, reserva: nuevaReserva };
}

function updateReserva(id, cambios) {
  const index = reservas.findIndex((item) => item.id === id);
  if (index === -1) {
    return { ok: false, error: 'Reserva no encontrada.' };
  }

  const actual = reservas[index];
  const nuevaVersion = { ...actual, ...cambios };

  const error = validarReserva(nuevaVersion);
  if (error) {
    return { ok: false, error };
  }

  reservas[index] = nuevaVersion;
  return { ok: true, reserva: nuevaVersion };
}

function deleteReserva(id) {
  const index = reservas.findIndex((item) => item.id === id);
  if (index === -1) {
    return { ok: false, error: 'Reserva no encontrada.' };
  }

  const [eliminada] = reservas.splice(index, 1);
  return { ok: true, reserva: eliminada };
}

function getReservasPorCanchaYFecha(cancha, fecha) {
  return reservas.filter((item) => Number(item.cancha) === Number(cancha) && item.fecha === fecha);
}

module.exports = {
  getReservas,
  getReservaPorId,
  createReserva,
  updateReserva,
  deleteReserva,
  getReservasPorCanchaYFecha,
  validarReserva,
  existeConflicto
};
