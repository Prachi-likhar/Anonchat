import { api } from './client';
import { PublicMember } from '../types/api';

export async function getBlockedMembers(): Promise<{ items: PublicMember[] }> {
  const res = await api.get<{ items: PublicMember[] }>('/blocks');
  return res.data;
}

export async function blockMember(memberId: string): Promise<void> {
  await api.post('/blocks', { memberId });
}

export async function unblockMember(memberId: string): Promise<void> {
  await api.delete(`/blocks/${memberId}`);
}
