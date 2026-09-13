import NetInfo from '@react-native-community/netinfo';
import { createContext, useContext, useEffect, useState } from 'react';

const ConnectivityContext = createContext(true);

export function ConnectivityProvider({ children }) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => setOnline(Boolean(state.isConnected && state.isInternetReachable !== false)));
    return unsubscribe;
  }, []);
  return <ConnectivityContext.Provider value={online}>{children}</ConnectivityContext.Provider>;
}

export function useOnline() {
  return useContext(ConnectivityContext);
}
