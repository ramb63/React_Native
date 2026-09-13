import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Image, Text } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useAuth } from '../context/AuthContext';
import InicioScreen from '../screens/InicioScreen';
import ReservasScreen from '../screens/ReservasScreen';
import CanchasScreen from '../screens/CanchasScreen';
import PerfilScreen from '../screens/PerfilScreen';
import DetalleReservaScreen from '../screens/DetalleReservaScreen';
import AcercaScreen from '../screens/AcercaScreen';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const tabImages = {
	Inicio: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/26bd.png',
	Agenda: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4c5.png',
	Canchas: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3df.png',
	Perfil: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f39f.png',
};

function TabIcon({ routeName, focused }) {
	return <Image accessibilityLabel={`Pestaña ${routeName}`} source={{ uri: tabImages[routeName] }} style={{ width: focused ? 25 : 22, height: focused ? 25 : 22, opacity: focused ? 1 : 0.65 }} />;
}

function AgendaStack() { return <Stack.Navigator><Stack.Screen name="Reservas" component={ReservasScreen} /><Stack.Screen name="DetalleReserva" component={DetalleReservaScreen} options={{ title: 'Detalle' }} /></Stack.Navigator>; }
function MainTabs() { return <Tabs.Navigator screenOptions={({ route }) => ({ tabBarIcon: ({ focused }) => <TabIcon routeName={route.name} focused={focused} /> })}><Tabs.Screen name="Inicio" component={InicioScreen} options={{ title: 'Inicio' }} /><Tabs.Screen name="Agenda" component={AgendaStack} options={{ headerShown: false, title: 'Agenda' }} /><Tabs.Screen name="Canchas" component={CanchasScreen} options={{ title: 'Canchas' }} /><Tabs.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Perfil' }} /></Tabs.Navigator>; }
function DrawerMenu(props) {
	const { signOut } = useAuth();
	return <DrawerContentScrollView {...props}><DrawerItem label="Inicio" onPress={() => props.navigation.navigate('Centro Deportivo', { screen: 'Inicio' })} /><DrawerItem label="Configuración" onPress={() => props.navigation.navigate('Centro Deportivo', { screen: 'Perfil' })} /><DrawerItem label="Acerca de" onPress={() => props.navigation.navigate('Acerca de')} /><DrawerItem label="Cerrar sesión" onPress={signOut} /></DrawerContentScrollView>;
}
export default function PrivateNavigator() { return <Drawer.Navigator drawerContent={(props) => <DrawerMenu {...props} />}><Drawer.Screen name="Centro Deportivo" component={MainTabs} options={{ headerShown: false }} /><Drawer.Screen name="Acerca de" component={AcercaScreen} /></Drawer.Navigator>; }
