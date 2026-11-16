import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { History } from 'lucide-react-native';
import { getAdminReport, resolveReport } from '@/api/admin';
import { Card, Badge, Button, TextField } from '@/components/ui';
import { formatTime, formatFullDate } from '@/lib/format';
import { formatErrorMessage } from '@/lib/errors';
import { tokens } from '@/theme/tokens';
import { toast } from '@/store/toastStore';

export default function AdminReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [resolutionStatus, setResolutionStatus] = useState<
    'resolved' | 'dismissed' | 'reviewing'
  >('resolved');
  const [resolutionAction, setResolutionAction] = useState<
    'none' | 'suspend' | 'ban'
  >('none');
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['admin-report', id],
    queryFn: () => getAdminReport(id!),
    enabled: Boolean(id),
  });

  const resolveMutation = useMutation({
    mutationFn: () =>
      resolveReport(id!, {
        status: resolutionStatus,
        action: resolutionAction,
        resolutionNote: resolutionNote.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-report', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Report resolved successfully');
      router.back();
    },
    onError: (err) => {
      toast.error(formatErrorMessage(err));
    },
  });

  if (isLoading || !report) {
    return (
      <View className="flex-1 items-center justify-center bg-background-light dark:bg-background-dark">
        <ActivityIndicator size="large" color={tokens.colors.primary.DEFAULT} />
      </View>
    );
  }

  const snapshotMessages = report.snapshot?.messages || [];

  return (
    <ScrollView
      className="flex-1 bg-background-light dark:bg-background-dark"
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
    >
      {/* Overview Card */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark border-primary/20">
        <View className="flex-row items-center justify-between mb-3">
          <Badge label={report.reason} variant="danger" size="md" />
          <Badge label={report.status} size="sm" />
        </View>

        <Text className="text-sm font-semibold text-content-light dark:text-content-dark">
          Reported Member:{' '}
          <Text className="text-danger font-bold">{report.reportedAnon}</Text>
        </Text>
        <Text className="text-xs text-muted-light dark:text-muted-dark mt-1">
          Filed by: {report.reporterAnon} • {formatFullDate(report.createdAt)}
        </Text>

        {report.details && (
          <View className="mt-3 p-3 rounded-xl bg-surface-2-light dark:bg-surface-2-dark">
            <Text className="text-xs font-semibold text-content-light dark:text-content-dark mb-0.5">
              Reporter's statement:
            </Text>
            <Text className="text-xs text-muted-light dark:text-muted-dark leading-relaxed">
              "{report.details}"
            </Text>
          </View>
        )}
      </Card>

      {/* Forensic Snapshot Viewer */}
      <Card className="p-4 mb-5 bg-surface-light dark:bg-surface-dark">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <History size={18} color={tokens.colors.primary.DEFAULT} />
            <Text className="text-sm font-bold text-content-light dark:text-content-dark ml-2">
              Forensic Conversation Snapshot
            </Text>
          </View>
          <Badge label={`${snapshotMessages.length} msgs`} size="sm" />
        </View>

        <Text className="text-xs text-muted-light dark:text-muted-dark mb-4 leading-relaxed">
          Tamper-proof capture of the last 30 messages in the thread at the time of report filing.
        </Text>

        {snapshotMessages.length === 0 ? (
          <View className="p-4 rounded-xl bg-surface-2-light dark:bg-surface-2-dark items-center">
            <Text className="text-xs text-muted-light dark:text-muted-dark">
              No snapshot messages captured for this report.
            </Text>
          </View>
        ) : (
          <View className="space-y-2">
            {snapshotMessages.map((msg, index) => {
              const isReportedUser =
                msg.senderId ? msg.senderId === report.reportedUserId : !msg.mine;
              const senderLabel = isReportedUser
                ? report.reportedAnon
                : report.reporterAnon;

              return (
                <View
                  key={msg.id || index}
                  className={`p-3 rounded-xl border ${
                    isReportedUser
                      ? 'bg-red-500/10 border-red-500/20'
                      : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark'
                  }`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text
                      className={`text-xs font-bold ${
                        isReportedUser ? 'text-danger' : 'text-primary'
                      }`}
                    >
                      {senderLabel}
                    </Text>
                    <Text className="text-[10px] text-muted-light dark:text-muted-dark">
                      {formatTime(msg.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-xs text-content-light dark:text-content-dark leading-relaxed">
                    {msg.body}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </Card>

      {/* Resolution Card */}
      {report.status !== 'resolved' && report.status !== 'dismissed' && (
        <Card className="p-4 mb-6 bg-surface-light dark:bg-surface-dark space-y-3">
          <Text className="text-sm font-bold text-content-light dark:text-content-dark mb-1">
            Resolve Report
          </Text>

          <Text className="text-xs font-semibold text-content-light dark:text-content-dark">
            Action on Reported Member
          </Text>
          <View className="flex-row space-x-2">
            {(
              [
                { label: 'No Action', value: 'none' },
                { label: 'Suspend', value: 'suspend' },
                { label: 'Permanent Ban', value: 'ban' },
              ] as const
            ).map((act) => (
              <TouchableOpacity
                key={act.value}
                onPress={() => setResolutionAction(act.value)}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  resolutionAction === act.value
                    ? 'bg-primary border-primary'
                    : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    resolutionAction === act.value
                      ? 'text-white'
                      : 'text-content-light dark:text-content-dark'
                  }`}
                >
                  {act.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-xs font-semibold text-content-light dark:text-content-dark mt-2">
            Status
          </Text>
          <View className="flex-row space-x-2">
            {(
              [
                { label: 'Resolved', value: 'resolved' },
                { label: 'Dismissed', value: 'dismissed' },
                { label: 'Reviewing', value: 'reviewing' },
              ] as const
            ).map((st) => (
              <TouchableOpacity
                key={st.value}
                onPress={() => setResolutionStatus(st.value)}
                className={`flex-1 py-2 rounded-xl items-center border ${
                  resolutionStatus === st.value
                    ? 'bg-primary border-primary'
                    : 'bg-surface-2-light dark:bg-surface-2-dark border-border-light dark:border-border-dark'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    resolutionStatus === st.value
                      ? 'text-white'
                      : 'text-content-light dark:text-content-dark'
                  }`}
                >
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextField
            label="Resolution Note"
            placeholder="Document moderation decision..."
            value={resolutionNote}
            onChangeText={setResolutionNote}
            multiline
          />

          <Button
            title="Submit Resolution"
            variant="primary"
            size="md"
            loading={resolveMutation.isPending}
            onPress={() => resolveMutation.mutate()}
          />
        </Card>
      )}

      {report.resolutionNote && (
        <Card className="p-4 mb-6 bg-green-500/10 border-green-500/20">
          <Text className="text-xs font-bold text-online mb-1">
            Resolution Note:
          </Text>
          <Text className="text-xs text-content-light dark:text-content-dark">
            {report.resolutionNote}
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}
