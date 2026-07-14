import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/database.js';
import User from '../models/User.js';
import WikiPage from '../models/WikiPage.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wiki-manager';

const seedUsers = [
  {
    name: 'Wiki Admin',
    email: 'admin@wikimanager.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Platform',
    isActive: true,
    lastLogin: new Date('2026-07-14T08:30:00.000Z'),
  },
  {
    name: 'Release Editor',
    email: 'editor@wikimanager.com',
    password: 'Editor@123',
    role: 'editor',
    department: 'Delivery',
    isActive: true,
    lastLogin: new Date('2026-07-13T16:45:00.000Z'),
  },
  {
    name: 'Operations Viewer',
    email: 'viewer@wikimanager.com',
    password: 'Viewer@123',
    role: 'viewer',
    department: 'Operations',
    isActive: true,
    lastLogin: new Date('2026-07-12T10:15:00.000Z'),
  },
];

const seedPages = [
  {
    title: 'Infrastructure Overview',
    content: '# Infrastructure Overview\n\nThis page documents the current infrastructure layout, environments, and service ownership.\n\n## Environments\n- Development\n- Staging\n- Production\n\n## Core Services\n- Backend API\n- Frontend App\n- MongoDB\n',
    category: 'infrastructure',
    tags: ['infra', 'architecture', 'services'],
    isPinned: true,
    isPublished: true,
    viewCount: 124,
    authorEmail: 'admin@wikimanager.com',
  },
  {
    title: 'Deployment Runbook',
    content: '# Deployment Runbook\n\nFollow this checklist for safe deployment.\n\n1. Pull latest code\n2. Install dependencies\n3. Build frontend\n4. Restart processes\n5. Verify health checks\n',
    category: 'deployment',
    tags: ['deployment', 'runbook', 'release'],
    isPinned: true,
    isPublished: true,
    viewCount: 97,
    authorEmail: 'editor@wikimanager.com',
  },
  {
    title: 'Database Backup and Restore',
    content: '# Database Backup and Restore\n\n## Backup\nUse periodic dumps for the wiki-manager database.\n\n## Restore\nTest restores in non-production before applying in production.\n',
    category: 'database',
    tags: ['database', 'backup', 'restore'],
    isPinned: false,
    isPublished: true,
    viewCount: 61,
    authorEmail: 'admin@wikimanager.com',
  },
  {
    title: 'Security Access Model',
    content: '# Security Access Model\n\nThis page explains authentication, role-based access, and secret handling expectations for the project.\n\n## Roles\n- Admin\n- Editor\n- Viewer\n\n## Key Rules\n- Use JWT-based sessions\n- Keep secrets in environment variables\n- Review role changes during releases\n',
    category: 'security',
    tags: ['security', 'auth', 'roles'],
    isPinned: true,
    isPublished: true,
    viewCount: 83,
    authorEmail: 'admin@wikimanager.com',
  },
  {
    title: 'Monitoring and Alert Guide',
    content: '# Monitoring and Alert Guide\n\nUse this guide to understand dashboards, alerts, and health-check expectations.\n\n## Core Signals\n- API availability\n- Error rate\n- Login failures\n- Database latency\n',
    category: 'monitoring',
    tags: ['monitoring', 'alerts', 'observability'],
    isPinned: false,
    isPublished: true,
    viewCount: 45,
    authorEmail: 'viewer@wikimanager.com',
  },
  {
    title: 'Troubleshooting Common Login Issues',
    content: '# Troubleshooting Common Login Issues\n\nWhen authentication fails, review these checks first.\n\n## Checklist\n1. Verify JWT secret is configured\n2. Confirm the client API base URL\n3. Inspect server logs for auth errors\n4. Check browser storage for stale tokens\n',
    category: 'troubleshooting',
    tags: ['troubleshooting', 'login', 'support'],
    isPinned: false,
    isPublished: true,
    viewCount: 72,
    authorEmail: 'editor@wikimanager.com',
  },
  {
    title: 'Application Overview and API Boundaries',
    content: '# Application Overview and API Boundaries\n\nThis page summarizes the frontend, backend, and API ownership model.\n\n## Frontend\n- React + Vite\n\n## Backend\n- Express + MongoDB\n\n## API Areas\n- Auth\n- Wiki\n- Search\n- Users\n',
    category: 'application',
    tags: ['application', 'api', 'frontend', 'backend'],
    isPinned: true,
    isPublished: true,
    viewCount: 138,
    authorEmail: 'editor@wikimanager.com',
  },
  {
    title: 'Project Glossary and Open Questions',
    content: '# Project Glossary and Open Questions\n\nUse this page to capture terms, assumptions, and unresolved questions that do not fit another category yet.\n\n## Current Notes\n- Confirm final connector scope for Confluence\n- Decide Jira status fields for demo summaries\n- Capture shared terminology for onboarding\n',
    category: 'other',
    tags: ['glossary', 'open-questions', 'demo'],
    isPinned: false,
    isPublished: true,
    viewCount: 29,
    authorEmail: 'viewer@wikimanager.com',
  },
];

async function ensureSeedUsers() {
  const usersByEmail = new Map();
  let created = 0;
  let existing = 0;

  for (const seedUser of seedUsers) {
    let user = await User.findOne({ email: seedUser.email });

    if (!user) {
      user = await User.create(seedUser);
      created += 1;
      console.log(`Created demo user: ${user.email}`);
    } else {
      existing += 1;
      console.log(`Demo user already exists: ${user.email}`);
    }

    usersByEmail.set(user.email, user);
  }

  return {
    usersByEmail,
    created,
    existing,
  };
}

async function seedWikiPages(usersByEmail) {
  let created = 0;
  let skipped = 0;

  for (const page of seedPages) {
    const existing = await WikiPage.findOne({ title: page.title });

    if (existing) {
      skipped += 1;
      continue;
    }

    const author = usersByEmail.get(page.authorEmail) || usersByEmail.get(seedUsers[0].email);

    await WikiPage.create({
      ...page,
      author: author._id,
      lastEditedBy: author._id,
    });

    created += 1;
  }

  return { created, skipped };
}

async function run() {
  try {
    await connectDB(MONGODB_URI);

    const users = await ensureSeedUsers();
    const result = await seedWikiPages(users.usersByEmail);
    const total = await WikiPage.countDocuments({});
    const totalUsers = await User.countDocuments({});

    console.log('Seed completed');
    console.log(JSON.stringify({
      demoUsersCreated: users.created,
      demoUsersExisting: users.existing,
      createdPages: result.created,
      skippedPages: result.skipped,
      totalPages: total,
      totalUsers,
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
