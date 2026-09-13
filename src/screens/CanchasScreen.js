import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { listLocal } from '../database';

const dates = [
  { value: '2026-09-10', label: 'Jue', day: '10' },
  { value: '2026-09-11', label: 'Vie', day: '11' },
  { value: '2026-09-12', label: 'Sab', day: '12' },
  { value: '2026-09-13', label: 'Dom', day: '13' },
  { value: '2026-09-14', label: 'Lun', day: '14' },
];
const slots = ['17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

export default function CanchasScreen({ navigation }) {
  const [reservas, setReservas] = useState([]);
  const [date, setDate] = useState(dates[0].value);
  useFocusEffect(useCallback(() => { listLocal().then(setReservas); }, []));

  const occupied = useMemo(() => (cancha, slot) => reservas.find((item) => Number(item.cancha) === cancha && item.fecha === date && item.horaInicio <= slot && item.horaFin > slot && item.estado !== 'Cancelada'), [date, reservas]);

  function book(cancha, slot) {
    navigation.navigate('Agenda', { screen: 'Reservas', params: { cancha: String(cancha), fecha: date, horaInicio: slot, horaFin: `${String(Number(slot.slice(0, 2)) + 1).padStart(2, '0')}:00`, cliente: '' } });
  }

  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <View style={styles.heading}><View><Text style={styles.eyebrow}>AGENDA DEPORTIVA</Text><Text style={styles.title}>Canchas</Text></View><Text style={styles.legend}>Toca un horario libre para agendar</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
      {dates.map((item) => <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={`Seleccionar ${item.label} ${item.day}`} onPress={() => setDate(item.value)} style={[styles.date, date === item.value && styles.dateActive]}><Text style={[styles.dateLabel, date === item.value && styles.dateLabelActive]}>{item.label}</Text><Text style={[styles.dateNumber, date === item.value && styles.dateLabelActive]}>{item.day}</Text></Pressable>)}
    </ScrollView>
    <Text style={styles.selectedDate}>Disponibilidad · {date}</Text>
    {[1, 2].map((cancha) => <View key={cancha} style={styles.card}><View style={styles.cardHeading}><Text style={styles.cardTitle}>Cancha {cancha}</Text><Text style={styles.cardHint}>Sintética</Text></View><View style={styles.timeline}>{slots.map((slot) => { const reservation = occupied(cancha, slot); const isBusy = Boolean(reservation); return <Pressable key={slot} disabled={isBusy} accessibilityRole="button" accessibilityLabel={`${slot}, ${isBusy ? `ocupado por ${reservation.cliente}` : 'libre, agendar'}`} onPress={() => book(cancha, slot)} style={[styles.slot, isBusy ? styles.busy : styles.free]}><Text style={styles.slotTime}>{slot}</Text><Text style={styles.slotState}>{isBusy ? reservation.cliente : 'Disponible'}</Text></Pressable>; })}</View></View>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f4f7f9' }, content: { padding: 20, gap: 16, paddingBottom: 32 }, heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }, eyebrow: { color: '#0ea5a4', fontWeight: '900', fontSize: 12, letterSpacing: 1.3 }, title: { color: '#102a43', fontSize: 34, fontWeight: '900', marginTop: 4 }, legend: { color: '#627d98', fontSize: 12, flex: 1, textAlign: 'right', lineHeight: 17 }, dateRow: { gap: 8, paddingVertical: 4 }, date: { width: 56, height: 68, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#d9e2ec' }, dateActive: { backgroundColor: '#102a43', borderColor: '#102a43' }, dateLabel: { color: '#627d98', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }, dateNumber: { color: '#102a43', fontSize: 21, fontWeight: '900' }, dateLabelActive: { color: '#fff' }, selectedDate: { color: '#52606d', fontWeight: '700' }, card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, gap: 14 }, cardHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, cardTitle: { color: '#102a43', fontSize: 20, fontWeight: '900' }, cardHint: { color: '#0ea5a4', fontWeight: '700', fontSize: 12 }, timeline: { gap: 8 }, slot: { minHeight: 54, borderRadius: 9, paddingHorizontal: 14, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, free: { backgroundColor: '#e4f7f2', borderLeftWidth: 4, borderLeftColor: '#0ea5a4' }, busy: { backgroundColor: '#fff0eb', borderLeftWidth: 4, borderLeftColor: '#ef8354' }, slotTime: { color: '#102a43', fontSize: 16, fontWeight: '900' }, slotState: { color: '#52606d', flex: 1, textAlign: 'right', fontSize: 13, fontWeight: '700' } });
