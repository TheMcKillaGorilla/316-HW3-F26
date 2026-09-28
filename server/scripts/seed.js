/**
 * seed.js
 *
 * npm run seed: wipes the database and loads the example lists. Run it once
 * after installing MongoDB, and again whenever you want a clean start.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { seedStarterLists } from '../src/seedStarterLists.js';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wolfie_lists';

try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    const count = await seedStarterLists();
    console.log(`Loaded ${count} example lists into ${MONGODB_URI}`);
} catch (error) {
    console.error(`Seeding ${MONGODB_URI} failed: ${error.message}`);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
