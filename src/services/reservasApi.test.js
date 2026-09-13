const test = require('node:test');
const assert = require('node:assert/strict');

const { getReservas, createReserva, updateReserva, deleteReserva } = require('./reservasApi.js');

test('GET /reservas devuelve lista inicial', () => {
  const reservas = getReservas();
  assert.ok(Array.isArray(reservas));
  assert.ok(reservas.length >= 1);
});

test('POST /reservas no permite cruces de horarios', () => {
  const conflicto = createReserva({
    cliente: 'Cliente Prueba',
    cancha: 1,
    fecha: '2026-09-10',
    horaInicio: '20:00',
    horaFin: '21:00',
    estado: 'Confirmada',
    anticipo: 0,
    tipoCliente: 'Normal',
    observaciones: 'Prueba conflicto'
  });

  assert.equal(conflicto.ok, false);
  assert.match(conflicto.error, /No se puede reservar/i);
});

test('PUT /reservas/:id actualiza una reserva', () => {
  const creada = createReserva({
    cliente: 'Reserva cambio',
    cancha: 2,
    fecha: '2026-09-12',
    horaInicio: '18:00',
    horaFin: '19:00',
    estado: 'Pendiente',
    anticipo: 0,
    tipoCliente: 'Frecuente',
    observaciones: 'Cambiar luego'
  });

  assert.equal(creada.ok, true);

  const actualizada = updateReserva(creada.reserva.id, {
    estado: 'Confirmada',
    observaciones: 'Actualizada'
  });

  assert.equal(actualizada.ok, true);
  assert.equal(actualizada.reserva.estado, 'Confirmada');
  assert.equal(actualizada.reserva.observaciones, 'Actualizada');
});

test('DELETE /reservas/:id elimina la reserva', () => {
  const creada = createReserva({
    cliente: 'Eliminar',
    cancha: 1,
    fecha: '2026-09-15',
    horaInicio: '17:00',
    horaFin: '18:00',
    estado: 'Pendiente',
    anticipo: 0,
    tipoCliente: 'Normal',
    observaciones: 'Eliminar'
  });

  const eliminado = deleteReserva(creada.reserva.id);
  assert.equal(eliminado.ok, true);
});
