import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

let database;
let databasePromise;

const seed = [
  ['res-1', 'Andres', 1, '2026-09-10', '20:00', '21:00', 'Pendiente', 0, 'Normal', 'Pago al llegar'],
  ['res-2', 'Empresa Luma', 2, '2026-09-10', '19:30', '21:30', 'Confirmada', 150, 'Empresa', 'Reserva fija semanal'],
];

const WEB_RESERVAS_KEY = 'zona8.reservas';
const WEB_PENDING_KEY = 'zona8.pending_operations';

function readWeb(key, fallback) {
  try {
    const value = globalThis.localStorage?.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeWeb(key, value) {
  globalThis.localStorage?.setItem(key, JSON.stringify(value));
}

function ensureWebData() {
  if (!globalThis.localStorage?.getItem(WEB_RESERVAS_KEY)) {
    writeWeb(WEB_RESERVAS_KEY, seed.map((item) => ({ id: item[0], cliente: item[1], cancha: item[2], fecha: item[3], horaInicio: item[4], horaFin: item[5], estado: item[6], anticipo: item[7], tipoCliente: item[8], observaciones: item[9], createdAt: new Date().toISOString() })));
  }
}

export async function getDatabase() {
  if (database) return database;
  if (!databasePromise) {
    databasePromise = (async () => {
      const db = await SQLite.openDatabaseAsync('zona8.db');
      await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS reservas (id TEXT PRIMARY KEY NOT NULL, cliente TEXT NOT NULL, cancha INTEGER NOT NULL, fecha TEXT NOT NULL, horaInicio TEXT NOT NULL, horaFin TEXT NOT NULL, estado TEXT NOT NULL, anticipo REAL NOT NULL, tipoCliente TEXT NOT NULL, observaciones TEXT NOT NULL, createdAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS pending_operations (id INTEGER PRIMARY KEY AUTOINCREMENT, operation TEXT NOT NULL, reservaId TEXT, payload TEXT NOT NULL, createdAt TEXT NOT NULL);
    `);
      const count = await db.getFirstAsync('SELECT COUNT(*) AS count FROM reservas');
      if (!count?.count) {
        for (const item of seed) {
          await db.runAsync('INSERT OR IGNORE INTO reservas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', ...item, new Date().toISOString());
        }
      }
      database = db;
      return db;
    })().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function listLocal() {
  if (Platform.OS === 'web') {
    ensureWebData();
    return readWeb(WEB_RESERVAS_KEY, []);
  }
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM reservas ORDER BY fecha, horaInicio');
}

export async function saveLocal(reserva) {
  if (Platform.OS === 'web') {
    ensureWebData();
    const reservas = readWeb(WEB_RESERVAS_KEY, []).filter((item) => item.id !== reserva.id);
    reservas.push({ ...reserva, cancha: Number(reserva.cancha), anticipo: Number(reserva.anticipo || 0), tipoCliente: reserva.tipoCliente || 'Normal', observaciones: reserva.observaciones || '', createdAt: reserva.createdAt || new Date().toISOString() });
    writeWeb(WEB_RESERVAS_KEY, reservas);
    return reserva;
  }
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO reservas VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', reserva.id, reserva.cliente, Number(reserva.cancha), reserva.fecha, reserva.horaInicio, reserva.horaFin, reserva.estado, Number(reserva.anticipo || 0), reserva.tipoCliente || 'Normal', reserva.observaciones || '', reserva.createdAt || new Date().toISOString());
  return reserva;
}

export async function updateLocal(id, changes) {
  if (Platform.OS === 'web') {
    const current = (await listLocal()).find((item) => item.id === id);
    if (!current) throw new Error('Reserva no encontrada');
    return saveLocal({ ...current, ...changes, id });
  }
  const db = await getDatabase();
  const current = await db.getFirstAsync('SELECT * FROM reservas WHERE id = ?', id);
  if (!current) throw new Error('Reserva no encontrada');
  return saveLocal({ ...current, ...changes, id });
}

export async function removeLocal(id) {
  if (Platform.OS === 'web') {
    writeWeb(WEB_RESERVAS_KEY, (await listLocal()).filter((item) => item.id !== id));
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reservas WHERE id = ?', id);
}

export async function enqueue(operation, reservaId, payload) {
  if (Platform.OS === 'web') {
    const operations = readWeb(WEB_PENDING_KEY, []);
    operations.push({ id: Date.now(), operation, reservaId, payload: JSON.stringify(payload || {}), createdAt: new Date().toISOString() });
    writeWeb(WEB_PENDING_KEY, operations);
    return;
  }
  const db = await getDatabase();
  await db.runAsync('INSERT INTO pending_operations (operation, reservaId, payload, createdAt) VALUES (?, ?, ?, ?)', operation, reservaId, JSON.stringify(payload || {}), new Date().toISOString());
}

export async function pendingOperations() {
  if (Platform.OS === 'web') return readWeb(WEB_PENDING_KEY, []);
  const db = await getDatabase();
  return db.getAllAsync('SELECT * FROM pending_operations ORDER BY id');
}

export async function pendingCount() {
  if (Platform.OS === 'web') return readWeb(WEB_PENDING_KEY, []).length;
  const db = await getDatabase();
  const result = await db.getFirstAsync('SELECT COUNT(*) AS count FROM pending_operations');
  return Number(result?.count || 0);
}

export async function removePending(id) {
  if (Platform.OS === 'web') {
    writeWeb(WEB_PENDING_KEY, readWeb(WEB_PENDING_KEY, []).filter((item) => item.id !== id));
    return;
  }
  const db = await getDatabase();
  await db.runAsync('DELETE FROM pending_operations WHERE id = ?', id);
}
