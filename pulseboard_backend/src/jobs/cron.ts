import cron from 'node-cron';
import ProcessedMail from '../models/ProcessedEmail.model';
import PersonalMail from '../models/PersonalEvent.model';

export const initCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      console.log('--- 🛡️ PulseBoard: Running 7-Day Cleanup ---');
      
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // 1. Delete Processed Mails (The Claude/Gemini classifications)
      const mailResult = await ProcessedMail.deleteMany({
        createdAt: { $lt: sevenDaysAgo }
      });

      // 2. Delete Personal Events
      const eventResult = await PersonalMail.deleteMany({
        createdAt: { $lt: sevenDaysAgo }
      });

      // Log results for both
      if (mailResult.deletedCount > 0 || eventResult.deletedCount > 0) {
        console.log(`[Cron] Cleanup Success: ${mailResult.deletedCount} mails and ${eventResult.deletedCount} events removed.`);
      } else {
        console.log('[Cron] No old data found to delete.');
      }

    } catch (error) {
      console.error('[Cron Error] Cleanup failed:', error);
    }
  });
};