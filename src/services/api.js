const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://dummyjson.com').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const statusMessages = { 400: 'La solicitud no es válida.', 401: 'La sesión no está autorizada.', 404: 'No se encontró el recurso.', 500: 'El servidor no está disponible.' };
    const error = new Error(body.message || statusMessages[response.status] || `Error HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return body;
}

function toReserva(post) {
  return {
    id: String(post.id),
    cliente: `Cliente ${post.id}`,
    cancha: (Number(post.id) % 2) + 1,
    fecha: '2026-09-10',
    horaInicio: '18:00',
    horaFin: '19:00',
    estado: 'Confirmada',
    anticipo: 0,
    tipoCliente: 'Normal',
    observaciones: 'Reserva sincronizada desde la plataforma.',
    createdAt: new Date().toISOString(),
    remote: true,
  };
}

export const reservasApi = {
  async list() {
    const result = await request('/posts?limit=20');
    return result.posts.map(toReserva);
  },
  async detail(id) {
    return toReserva(await request(`/posts/${id}`));
  },
  async create(reserva) {
    const result = await request('/posts/add', {
      method: 'POST',
      body: JSON.stringify({ title: reserva.cliente, body: reserva.observaciones, userId: 1 }),
    });
    return { ...reserva, id: String(result.id), remote: true };
  },
  async update(id, changes) {
    const result = await request(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: changes.cliente, body: changes.observaciones }),
    });
    return { ...changes, id: String(result.id || id), remote: true };
  },
  async remove(id) {
    return request(`/posts/${id}`, { method: 'DELETE' });
  },
  async login(username, password) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, expiresInMins: 30 }) });
  },
  async me(token) {
    return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  },
};
