/**
 * server.js
 *
 * The entry point: connect to MongoDB, then start listening for requests.
 * Settings come from server/.env (copy .env.example to make one).
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/wolfie_lists';

// mongoose.connection is an EventEmitter, so we can subscribe to what happens
// to the connection later, not just to whether it worked the first time
mongoose.connection.on('disconnected', () => console.log('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB at ${MONGODB_URI}`);
} catch (error) {
    console.error(`Could not connect to MongoDB at ${MONGODB_URI}. Is mongod running?`);
    console.error(error.message);
    process.exit(1);
}

createApp().listen(PORT, () => {
    console.log(`Wolfie Lists API listening on http://localhost:${PORT}`);
});
