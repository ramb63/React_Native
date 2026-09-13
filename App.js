import 'react-native-gesture-handler';
import './src/global.css';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ConnectivityProvider } from './src/context/ConnectivityContext';
import PrivateNavigator from './src/navigation';
import LoginScreen from './src/screens/LoginScreen';

function Root() {
  const { session, loading } = useAuth();
  const scheme = useColorScheme();
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator accessibilityLabel="Cargando sesion" /></View>;
  return <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>{session ? <PrivateNavigator /> : <LoginScreen />}</NavigationContainer>;
}

export default function App() { return <ConnectivityProvider><AuthProvider><Root /></AuthProvider></ConnectivityProvider>; }
