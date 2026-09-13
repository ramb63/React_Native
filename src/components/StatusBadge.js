import { StyleSheet, Text } from 'react-native';
import { colors } from '../constants/theme';

export default function StatusBadge({ status }) {
  const color = colors.status[status] || colors.status.Pendiente;
  return <Text className="px-2 py-1" accessibilityRole="text" accessibilityLabel={`Estado: ${status}`} style={[styles.badge, { color, backgroundColor: `${color}18`, borderColor: color }]}>{status}</Text>;
}

const styles = StyleSheet.create({ badge: { fontWeight: '900', borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, overflow: 'hidden' } });
