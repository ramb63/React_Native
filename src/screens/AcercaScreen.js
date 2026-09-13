import { StyleSheet, Text, View } from 'react-native';

export default function AcercaScreen() {
  return <View style={styles.page}><Text style={styles.title}>Acerca de Zona 8</Text><Text style={styles.text}>Gestión de reservas y ocupación para el Centro Deportivo Zona 8.</Text><Text style={styles.text}>Versión de demostración · Expo SDK 54</Text></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f4f7f9', padding: 20, gap: 14 }, title: { color: '#102a43', fontSize: 30, fontWeight: '900' }, text: { color: '#52606d', fontSize: 16, lineHeight: 23 } });
