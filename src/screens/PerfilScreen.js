import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';

const SETTINGS_KEY = 'zona8.admin.settings';
const defaultSettings = { centerName: 'Centro Deportivo Zona 8', defaultAdvance: '0', maintenance: false, offlineReservations: true };

async function readSettings() {
	if (Platform.OS === 'web') return globalThis.localStorage?.getItem(SETTINGS_KEY);
	return SecureStore.getItemAsync(SETTINGS_KEY);
}

async function saveSettings(value) {
	if (Platform.OS === 'web') {
		globalThis.localStorage?.setItem(SETTINGS_KEY, value);
		return;
	}
	await SecureStore.setItemAsync(SETTINGS_KEY, value);
}

export default function PerfilScreen() {
	const { session, updateProfile, signOut } = useAuth();
	const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '' });
	const [settings, setSettings] = useState(defaultSettings);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		setProfile({
			firstName: session?.user?.firstName || 'Fabian',
			lastName: session?.user?.lastName || 'Barrientos',
			email: session?.user?.email || 'Orleyfabian.r@gmail.com',
		});
		readSettings().then((value) => {
			if (value) setSettings({ ...defaultSettings, ...JSON.parse(value) });
		}).catch(() => {});
	}, [session]);

	function changeProfile(field, value) {
		setProfile((current) => ({ ...current, [field]: value }));
	}

	async function saveChanges() {
		if (!profile.firstName.trim() || !profile.email.trim() || !profile.email.includes('@')) {
			Alert.alert('Datos incompletos', 'Indica un nombre y un correo válido.');
			return;
		}
		setSaving(true);
		try {
			await updateProfile(profile);
			await saveSettings(JSON.stringify(settings));
			Alert.alert('Cambios guardados', 'El perfil y la configuración de la plataforma fueron actualizados.');
		} catch (error) {
			Alert.alert('No se pudo guardar', error.message);
		} finally {
			setSaving(false);
		}
	}

	return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
		<View style={styles.header}>
			<View style={styles.avatar}><Text style={styles.avatarText}>{profile.firstName.slice(0, 1).toUpperCase()}</Text></View>
			<View style={styles.headerCopy}><Text style={styles.title}>Mi cuenta</Text><Text style={styles.subtitle}>Administrador de Zona 8</Text></View>
		</View>

		<View style={styles.card}>
			<Text style={styles.label}>Información personal</Text>
			<TextInput accessibilityLabel="Nombre del administrador" value={profile.firstName} onChangeText={(value) => changeProfile('firstName', value)} placeholder="Nombre" style={styles.input} />
			<TextInput accessibilityLabel="Apellido del administrador" value={profile.lastName} onChangeText={(value) => changeProfile('lastName', value)} placeholder="Apellido" style={styles.input} />
			<TextInput accessibilityLabel="Correo del administrador" value={profile.email} onChangeText={(value) => changeProfile('email', value)} placeholder="Correo" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
		</View>

		<View style={styles.card}>
			<Text style={styles.label}>Preferencias del centro</Text>
			<TextInput accessibilityLabel="Nombre del centro deportivo" value={settings.centerName} onChangeText={(value) => setSettings((current) => ({ ...current, centerName: value }))} placeholder="Nombre del centro" style={styles.input} />
			<TextInput accessibilityLabel="Anticipo predeterminado" value={settings.defaultAdvance} onChangeText={(value) => setSettings((current) => ({ ...current, defaultAdvance: value.replace(/[^0-9]/g, '') }))} placeholder="Anticipo predeterminado" keyboardType="numeric" style={styles.input} />
			<SettingRow label="Permitir reservas sin conexión" value={settings.offlineReservations} onChange={(value) => setSettings((current) => ({ ...current, offlineReservations: value }))} />
			<SettingRow label="Modo mantenimiento" value={settings.maintenance} onChange={(value) => setSettings((current) => ({ ...current, maintenance: value }))} />
			{settings.maintenance ? <Text style={styles.warning}>El modo mantenimiento debe usarse para bloquear temporalmente la operación del centro.</Text> : null}
		</View>

		<Pressable accessibilityRole="button" accessibilityLabel="Guardar cambios" onPress={saveChanges} disabled={saving} style={styles.save}><Text style={styles.saveText}>{saving ? 'Guardando...' : 'Guardar cambios'}</Text></Pressable>
		<View style={styles.rules}><Text style={styles.rulesTitle}>Reglas activas</Text><Text style={styles.rule}>No se cruzan horarios en la misma cancha.</Text><Text style={styles.rule}>Los cambios offline se sincronizan al volver la red.</Text><Text style={styles.rule}>En conflicto gana la última versión confirmada por servidor.</Text></View>
		<Pressable accessibilityRole="button" onPress={signOut} style={styles.logout}><Text style={styles.logoutText}>Cerrar sesión</Text></Pressable>
	</ScrollView>;
}

function SettingRow({ label, value, onChange }) {
	return <View style={styles.settingRow}><Text style={styles.settingText}>{label}</Text><Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ false: '#bcccdc', true: '#7dd3fc' }} thumbColor={value ? '#0ea5a4' : '#f4f7f9'} /></View>;
}

const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: '#f4f7f9' }, content: { padding: 20, gap: 16 }, header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 }, avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0ea5a4', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 25, fontWeight: '900' }, headerCopy: { flex: 1, gap: 2 }, title: { fontSize: 32, fontWeight: '900', color: '#102a43' }, subtitle: { color: '#52606d', lineHeight: 21 }, card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, gap: 10 }, label: { color: '#627d98', fontWeight: '800', textTransform: 'uppercase', fontSize: 12 }, input: { borderWidth: 1, borderColor: '#bcccdc', borderRadius: 9, padding: 12, backgroundColor: '#fff', fontSize: 16 }, settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 4 }, settingText: { color: '#334e68', flex: 1, lineHeight: 20 }, warning: { color: '#9c4221', backgroundColor: '#fffaf0', padding: 10, borderRadius: 8, lineHeight: 19 }, rules: { paddingHorizontal: 4, gap: 9 }, rulesTitle: { color: '#102a43', fontWeight: '800', fontSize: 18 }, rule: { color: '#52606d', lineHeight: 21 }, save: { backgroundColor: '#0ea5a4', padding: 16, borderRadius: 10, alignItems: 'center' }, saveText: { color: '#fff', fontWeight: '800', fontSize: 16 }, logout: { backgroundColor: '#ef8354', padding: 15, borderRadius: 10, alignItems: 'center' }, logoutText: { color: '#fff', fontWeight: '800' } });
