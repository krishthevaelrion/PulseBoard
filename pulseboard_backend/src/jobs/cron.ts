import cron from 'node-cron';
import ProcessedEmail from '../models/ProcessedEmail.model';
import PersonalEvent from '../models/PersonalEvent.model';
import Event from '../models/Event.model';

export const initCronJobs = () => {
  // Runs every day at midnight
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('[Cron] Running daily cleanup...');

      const now = new Date();

      // 1. Delete completed global Events 1 day after their event date
      const oneDayAgo = new Date(now);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const eventResult = await Event.deleteMany({
        date: { $lt: oneDayAgo },
      });

      // 2. Delete PersonalEvents (Smart Inbox) older than 28 days
      const twentyEightDaysAgo = new Date(now);
      twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);

      const personalResult = await PersonalEvent.deleteMany({
        createdAt: { $lt: twentyEightDaysAgo },
      });

      // 3. Delete ProcessedEmail cache older than 7 days (keeps cache fresh)
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const cacheResult = await ProcessedEmail.deleteMany({
        createdAt: { $lt: sevenDaysAgo },
      });

      console.log(`[Cron] Deleted ${eventResult.deletedCount} expired events, ${personalResult.deletedCount} old inbox items, ${cacheResult.deletedCount} cache entries`);

    } catch (error) {
      console.error('[Cron] Cleanup failed:', error);
    }
  });
};
