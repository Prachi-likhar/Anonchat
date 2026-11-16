import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(state.isConnected === false);
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <View className="bg-amber-600 px-4 py-2 flex-row items-center justify-center space-x-2">
      <WifiOff size={16} color="#FFFFFF" />
      <Text className="text-xs font-semibold text-white ml-1.5">
        No internet connection. Reconnecting...
      </Text>
    </View>
  );
};
