import api from '../config/api';
import {bumpDataVersion} from '../utils/dataVersion';

export type ReportTarget = 'design' | 'comment';
export type ReportReason =
  | 'offensive'
  | 'harassment'
  | 'spam'
  | 'copyright'
  | 'other';

export interface IBlockedUser {
  id: string; // the block's id (used to unblock)
  name: string;
  profile_picture: string | null;
  blocked_at: string;
}

// Reporting content and blocking users (be/src/moderation). Reported
// content and everything from blocked users disappears for this user.
const ModerationService = {
  async report(
    targetType: ReportTarget,
    targetId: string,
    reason: ReportReason,
    details?: string,
  ): Promise<void> {
    await api.post('/moderation/reports', {
      target_type: targetType,
      target_id: targetId,
      reason,
      details,
    });
    bumpDataVersion('designs');
  },

  // Blocks whoever posted this design or comment.
  async block(targetType: ReportTarget, targetId: string): Promise<void> {
    await api.post('/moderation/blocks', {
      target_type: targetType,
      target_id: targetId,
    });
    bumpDataVersion('designs');
  },

  async blocked(): Promise<IBlockedUser[]> {
    const res = await api.get('/moderation/blocks');
    return res.data.data;
  },

  async unblock(blockId: string): Promise<void> {
    await api.delete(`/moderation/blocks/${blockId}`);
    bumpDataVersion('designs');
  },
};

export default ModerationService;
