import React from 'react';
import { View } from 'react-native';
import { Compass } from 'lucide-react-native';
import { EmptyState } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';

export default function DiscoverScreen() {
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 items-center justify-center">
      <EmptyState
        icon={<Compass size={32} color={tokens.colors.primary.DEFAULT} />}
        title="Discover Community Members"
        description="Search by anonymous handle and filter by gender category. Phase 3 implementation."
      />
    </View>
  );
}
