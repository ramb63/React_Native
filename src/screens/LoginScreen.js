import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    try { await signIn(username, password); } catch (error) { Alert.alert('No se pudo iniciar sesion', error.message); } finally { setBusy(false); }
  }
  return <View style={styles.page}><Text style={styles.eyebrow}>CENTRO DEPORTIVO</Text><Text style={styles.title}>Zona 8</Text><Text style={styles.copy}>Gestiona reservas, canchas y anticipos desde un solo lugar.</Text><TextInput accessibilityLabel="Usuario" value={username} onChangeText={setUsername} autoCapitalize="none" style={styles.input} placeholder="Usuario" /><TextInput accessibilityLabel="Contrasena" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} placeholder="Contrasena" /><Pressable accessibilityRole="button" accessibilityLabel="Iniciar sesion" onPress={submit} disabled={busy} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Entrando...' : 'Iniciar sesion'}</Text></Pressable></View>;
}
const styles = StyleSheet.create({ page: { flex: 1, justifyContent: 'center', padding: 28, backgroundColor: '#102a43' }, eyebrow: { color: '#7dd3fc', fontWeight: '800', letterSpacing: 2 }, title: { color: '#fff', fontSize: 48, fontWeight: '900', marginTop: 8 }, copy: { color: '#d9e2ec', fontSize: 17, lineHeight: 25, marginVertical: 28 }, input: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 }, button: { backgroundColor: '#f59e0b', borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 8 }, buttonText: { color: '#102a43', fontWeight: '800', fontSize: 16 } });
