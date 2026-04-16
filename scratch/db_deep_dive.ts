import { initializeDatabase } from '../server/services/init';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
    console.log('Starting DB Deep Dive...');
    try {
        await initializeDatabase();
        console.log('DB Initialization complete.');
        process.exit(0);
    } catch (err: any) {
        console.error('DB Deep Dive Failed:', err.message);
        process.exit(1);
    }
}

run();
