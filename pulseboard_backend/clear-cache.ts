import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProcessedEmail from './src/models/ProcessedEmail.model';

dotenv.config();

async function clearCache() {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        console.log('Connected to DB');
        await ProcessedEmail.deleteMany({});
        console.log('Cleared ProcessedEmail cache.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

clearCache();
