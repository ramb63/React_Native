import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { listLocal, pendingCount, pendingOperations, removeLocal, saveLocal, updateLocal } from '../database';
import { useOnline } from '../context/ConnectivityContext';
import { enqueue, syncPending } from '../services/sync';
import { reservasApi } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import { colors } from '../constants/theme';
import { validateReserva } from '../utils/validation';

const blank = { cliente: '', cancha: '1', fecha: '2026-09-10', horaInicio: '18:00', horaFin: '19:00', estado: 'Pendiente', anticipo: '0', tipoCliente: 'Normal', observaciones: '' };

export default function ReservasScreen({ navigation, route }) {
  const online = useOnline();
  const [reservas, setReservas] = useState([]);
  const [form, setForm] = useState(blank);
  const [modal, setModal] = useState(false);
  const [operation, setOperation] = useState({ list: 'idle', create: 'idle', update: 'idle', remove: 'idle', sync: 'idle' });
  const [error, setError] = useState('');
  const [pending, setPending] = useState(0);
  const [pendingIds, setPendingIds] = useState([]);
  const [remoteError, setRemoteError] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synced');

  useEffect(() => {
    if (route?.params) {
      setForm((current) => ({ ...current, ...route.params }));
      setModal(true);
    }
  }, [route?.params]);

  const refresh = useCallback(async () => {
    setOperation((current) => ({ ...current, list: 'loading' }));
    try {
      setReservas(await listLocal());
      setPending(await pendingCount());
      setPendingIds((await pendingOperations()).map((item) => item.reservaId));
      setOperation((current) => ({ ...current, list: 'success' }));
    } catch (e) {
      setOperation((current) => ({ ...current, list: 'error' }));
      setError(`No se pudo leer SQLite: ${e.message}`);
    }
  }, []);

  const synchronize = useCallback(async () => {
    if (!online) {
      setSyncStatus(pending > 0 ? 'pending' : 'synced');
      return;
    }
    setSyncStatus('syncing');
    setOperation((current) => ({ ...current, sync: 'loading' }));
    try {
      const result = await syncPending();
      await refresh();
      setOperation((current) => ({ ...current, sync: result.failed ? 'error' : 'success' }));
      setSyncStatus(result.failed ? 'failed' : 'synced');
      if (result.failed) setError(`Sincronización pendiente: ${result.failed.message}`);
    } catch (e) {
      setOperation((current) => ({ ...current, sync: 'error' }));
      setSyncStatus('failed');
      setError(`No se pudo sincronizar: ${e.message}`);
    }
  }, [online, pending, refresh]);

  const loadRemote = useCallback(() => {
    if (!online) return;
    setRemoteError(false);
    setOperation((current) => ({ ...current, list: 'loading' }));
    return reservasApi.list().then(async (remote) => {
      for (const item of remote) await saveLocal(item);
      await refresh();
    }).catch((e) => {
      setRemoteError(true);
      setOperation((current) => ({ ...current, list: 'error' }));
      setError(`Error HTTP al cargar reservas: ${e.message}`);
    });
  }, [online, refresh]);

  const loadData = useCallback(async () => {
    await refresh();
    await synchronize();
    if (online) await loadRemote();
  }, [online, loadRemote, refresh, synchronize]);

  useFocusEffect(useCallback(() => {
    loadData();
  }, [loadData]));

  function change(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function create() {
    const validationError = validateReserva(form);
    if (validationError) return setError(validationError);
    setOperation((current) => ({ ...current, create: 'loading' }));
    setError('');
    const item = { ...form, id: `local-${Date.now()}`, cancha: Number(form.cancha), anticipo: Number(form.anticipo), createdAt: new Date().toISOString() };
    try {
      await saveLocal(item);
      if (online) await reservasApi.create(item);
      else {
        await enqueue('create', item.id, item);
        setSyncStatus('pending');
      }
      setOperation((current) => ({ ...current, create: 'success' }));
      setModal(false);
      setForm(blank);
      refresh();
    } catch (e) {
      await enqueue('create', item.id, item);
      setSyncStatus('pending');
      setOperation((current) => ({ ...current, create: 'error' }));
      setError(`Reserva guardada localmente. Se reintentará: ${e.message}`);
      setModal(false);
      refresh();
    }
  }

  async function toggle(item) {
    const next = item.estado === 'Pendiente' ? 'Confirmada' : 'Pendiente';
    setOperation((current) => ({ ...current, update: 'loading' }));
    try {
      await updateLocal(item.id, { estado: next });
      if (online) await reservasApi.update(item.id, { ...item, estado: next });
      else {
        await enqueue('update', item.id, { estado: next });
        setSyncStatus('pending');
      }
      setOperation((current) => ({ ...current, update: 'success' }));
      refresh();
    } catch (e) {
      await enqueue('update', item.id, { estado: next });
      setSyncStatus('pending');
      setOperation((current) => ({ ...current, update: 'error' }));
      setError(`Cambio guardado localmente. Se reintentará: ${e.message}`);
      refresh();
    }
  }

  async function remove(item) {
    setOperation((current) => ({ ...current, remove: 'loading' }));
    try {
      await removeLocal(item.id);
      if (online) await reservasApi.remove(item.id);
      else await enqueue('delete', item.id, {});
      setOperation((current) => ({ ...current, remove: 'success' }));
      refresh();
    } catch (e) {
      await enqueue('delete', item.id, {});
      setOperation((current) => ({ ...current, remove: 'error' }));
      setError(`Eliminación pendiente: ${e.message}`);
      refresh();
    }
  }

  return <View style={styles.page}>
    <View style={styles.top}>
      <View>
        <Text style={styles.title}>Reservas</Text>
        <Text style={[styles.network, { color: online ? '#0ea5a4' : '#ef8354' }]}>{online ? '● En línea' : '● Sin conexión · cambios locales'}</Text>
        {syncStatus === 'syncing' ? <Text style={styles.syncText}>Sincronizando...</Text> : syncStatus === 'pending' ? <Text style={styles.pendingText}>{pending} cambio(s) pendiente(s)</Text> : syncStatus === 'failed' ? <Text style={styles.failedText}>Sincronización fallida</Text> : <Text style={styles.syncedText}>Sincronizado</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Nueva reserva" onPress={() => setModal(true)} style={styles.add}><Text style={styles.addText}>+ Nueva</Text></Pressable>
    </View>

    {error ? <View accessibilityRole="alert" style={styles.errorBanner}><Text style={styles.error}>{error}</Text>{remoteError ? <Pressable accessibilityRole="button" accessibilityLabel="Reintentar carga remota" onPress={loadRemote}><Text style={styles.retry}>Reintentar</Text></Pressable> : null}<Pressable accessibilityLabel="Cerrar mensaje" onPress={() => setError('')}><Text style={styles.dismiss}>Cerrar</Text></Pressable></View> : null}
    {operation.list === 'loading' && reservas.length === 0 ? <Text style={styles.info}>Cargando reservas...</Text> : null}
    <ScrollView contentContainerStyle={styles.content}>
      {reservas.map((item) => {
        const statusColor = colors.status[item.estado] || colors.status.Pendiente;
        const syncLabel = pendingIds.includes(item.id) ? 'Pendiente de sincronización' : item.id.startsWith('local-') ? 'Sincronizada' : 'Guardada localmente';
        return <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`${item.cliente}, estado ${item.estado}`} onPress={() => navigation.navigate('DetalleReserva', { id: item.id })} style={[styles.card, { borderLeftColor: statusColor }]}>
          <View style={styles.row}><Text style={styles.client}>{item.cliente}</Text><StatusBadge status={item.estado} /></View>
          <Text>Cancha {item.cancha} · {item.fecha}</Text><Text>{item.horaInicio} - {item.horaFin} · Anticipo $ {item.anticipo}</Text><Text style={[styles.syncLabel, pendingIds.includes(item.id) && styles.syncPending]}>{syncLabel}</Text>
          <View style={styles.actions}><Pressable disabled={operation.update === 'loading' || operation.remove === 'loading'} accessibilityLabel={`Cambiar estado de ${item.cliente}`} onPress={() => toggle(item)} style={styles.secondary}><Text>{operation.update === 'loading' ? 'Actualizando...' : 'Cambiar estado'}</Text></Pressable><Pressable disabled={operation.remove === 'loading' || operation.update === 'loading'} accessibilityLabel={`Eliminar reserva de ${item.cliente}`} onPress={() => Alert.alert('Eliminar reserva', 'Esta acción no se puede deshacer.', [{ text: 'Cancelar' }, { text: 'Eliminar', onPress: () => remove(item), style: 'destructive' }])} style={styles.danger}><Text>{operation.remove === 'loading' ? 'Eliminando...' : 'Eliminar'}</Text></Pressable></View>
        </Pressable>;
      })}
    </ScrollView>

    <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}>
      <ScrollView contentContainerStyle={styles.modal}><Text style={styles.title}>Nueva reserva</Text>{Object.entries(form).filter(([key]) => key !== 'estado').map(([key, value]) => <TextInput key={key} accessibilityLabel={key} placeholder={key} value={String(value)} onChangeText={(text) => change(key, text)} keyboardType={['cancha', 'anticipo'].includes(key) ? 'numeric' : 'default'} style={styles.input} />)}{error ? <Text style={styles.error}>{error}</Text> : null}<Pressable disabled={operation.create === 'loading'} accessibilityRole="button" onPress={create} style={styles.save}><Text style={styles.saveText}>{operation.create === 'loading' ? 'Guardando...' : 'Guardar localmente'}</Text></Pressable><Pressable disabled={operation.create === 'loading'} onPress={() => setModal(false)} style={styles.cancel}><Text>Cancelar</Text></Pressable></ScrollView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f4f7f9', padding: 20 }, content: { gap: 12, paddingBottom: 30 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, title: { fontSize: 32, fontWeight: '900', color: '#102a43' }, network: { marginTop: 4, fontWeight: '700' }, syncText: { color: '#2563eb', fontWeight: '700', marginTop: 3 }, pendingText: { color: '#d97706', fontWeight: '700', marginTop: 3 }, info: { color: '#52606d', marginBottom: 10 }, errorBanner: { backgroundColor: '#fff1f2', borderColor: '#fecdd3', borderWidth: 1, borderRadius: 9, padding: 10, marginBottom: 10, gap: 5 }, error: { color: '#be123c', lineHeight: 19 }, retry: { color: '#9f1239', fontWeight: '900' }, dismiss: { color: '#9f1239', fontWeight: '800' }, add: { backgroundColor: '#0ea5a4', padding: 12, borderRadius: 9 }, addText: { color: '#fff', fontWeight: '800' }, card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 8, borderLeftWidth: 5 }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, client: { fontWeight: '800', fontSize: 17, color: '#102a43' }, syncLabel: { color: '#0ea5a4', fontSize: 12, fontWeight: '800' }, syncPending: { color: '#d97706' }, badge: { fontWeight: '900', borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden' }, actions: { flexDirection: 'row', gap: 8, marginTop: 8 }, secondary: { backgroundColor: '#d9f0ef', padding: 9, borderRadius: 7, flex: 1, alignItems: 'center' }, danger: { backgroundColor: '#ffe3dc', padding: 9, borderRadius: 7, flex: 1, alignItems: 'center' }, modal: { padding: 20, gap: 12, flexGrow: 1 }, input: { borderWidth: 1, borderColor: '#bcccdc', borderRadius: 9, padding: 13, backgroundColor: '#fff' }, save: { backgroundColor: '#0ea5a4', padding: 16, borderRadius: 9, alignItems: 'center' }, saveText: { color: '#fff', fontWeight: '800' }, cancel: { padding: 14, alignItems: 'center' } });
