import React from 'react';
import { View } from 'react-native';
import { MessageSquare } from 'lucide-react-native';
import { EmptyState } from '../../src/components/ui';
import { tokens } from '../../src/theme/tokens';

export default function ChatsScreen() {
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark p-4 items-center justify-center">
      <EmptyState
        icon={<MessageSquare size={32} color={tokens.colors.primary.DEFAULT} />}
        title="Your Conversations"
        description="Active and past anonymous conversations will appear here. Phase 4 implementation."
      />
    </View>
  );
}
