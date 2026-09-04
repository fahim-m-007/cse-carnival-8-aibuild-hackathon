import mongoose from './server/node_modules/mongoose/index.js';
import dotenv from './server/node_modules/dotenv/lib/main.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, 'server/.env') });

const uri = process.env.MONGODB_URI;

if (!uri || uri.includes('your_mongodb_uri_here')) {
  console.error('No MONGODB_URI found in .env file!');
  process.exit(1);
}

console.log('\nConnecting to MongoDB Atlas...');
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 6000 });
  const db = mongoose.connection.db;
  console.log(` Connected to Database: [${db.databaseName}] on Cluster0!\n`);

  const collections = await db.listCollections().toArray();
  console.log('=== COLLECTIONS IN YOUR MONGODB ATLAS ===');
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(` • Collection: [${c.name}] -> ${count} records`);
  }

  console.log('\n=== REGISTERED USERS IN MONGODB ATLAS ===');
  const users = await db.collection('users').find({}).toArray();
  console.table(users.map(u => ({
    MongoDB_BSON_ID: u._id.toString(),
    Name: u.name,
    Email: u.eduMail,
    StudentID: u.studentId,
    Dept: u.dept
  })));

  await mongoose.disconnect();
  console.log('Disconnection complete. Your data is 100% saved in MongoDB Atlas cloud!\n');
} catch (err) {
  console.error('Error connecting to MongoDB Atlas:', err.message);
}
