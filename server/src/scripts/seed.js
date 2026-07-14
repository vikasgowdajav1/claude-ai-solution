import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database.js';
import User from '../models/User.js';
import WikiPage from '../models/WikiPage.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wiki-manager';

const seedUser = {
  name: 'Wiki Admin',
  email: 'admin@wikimanager.com',
  password: 'Admin@123',
  role: 'admin',
  department: 'Platform',
  isActive: true,
};

const seedPages = [
  {
    title: 'Infrastructure Overview',
    content: '# Infrastructure Overview\n\nThis page documents the current infrastructure layout, environments, and service ownership.\n\n## Environments\n- Development\n- Staging\n- Production\n\n## Core Services\n- Backend API\n- Frontend App\n- MongoDB\n',
    category: 'infrastructure',
    tags: ['infra', 'architecture', 'services'],
    isPinned: true,
    isPublished: true,
  },
  {
    title: 'Deployment Runbook',
    content: '# Deployment Runbook\n\nFollow this checklist for safe deployment.\n\n1. Pull latest code\n2. Install dependencies\n3. Build frontend\n4. Restart processes\n5. Verify health checks\n',
    category: 'deployment',
    tags: ['deployment', 'runbook', 'release'],
    isPinned: true,
    isPublished: true,
  },
  {
    title: 'Database Backup and Restore',
    content: '# Database Backup and Restore\n\n## Backup\nUse periodic dumps for the wiki-manager database.\n\n## Restore\nTest restores in non-production before applying in production.\n',
    category: 'database',
    tags: ['database', 'backup', 'restore'],
    isPinned: false,
    isPublished: true,
  },
];

async function ensureSeedUser() {
  let user = await User.findOne({ email: seedUser.email });

  if (!user) {
    user = await User.create(seedUser);
    console.log(`Created demo user: ${user.email}`);
  } else {
    console.log(`Demo user already exists: ${user.email}`);
  }

  return user;
}

async function seedWikiPages(user) {
  let created = 0;
  let skipped = 0;

  for (const page of seedPages) {
    const existing = await WikiPage.findOne({ title: page.title });

    if (existing) {
      skipped += 1;
      continue;
    }

    await WikiPage.create({
      ...page,
      author: user._id,
      lastEditedBy: user._id,
    });

    created += 1;
  }

  return { created, skipped };
}

async function run() {
  try {
    await connectDB(MONGODB_URI);

    const user = await ensureSeedUser();
    const result = await seedWikiPages(user);
    const total = await WikiPage.countDocuments({});

    console.log('Seed completed');
    console.log(JSON.stringify({
      user: user.email,
      createdPages: result.created,
      skippedPages: result.skipped,
      totalPages: total,
    }));
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await disconnectDB();
    }
  }
}

run();
