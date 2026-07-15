/**
 * Seed script for Sherpa trails — creates sample trails with realistic steps and records
 */

import mongoose from 'mongoose';
import '../config/loadEnv.js';
import { connectDB, resolveMongoUri } from '../config/database.js';
import Trail from '../models/Trail.js';
import User from '../models/User.js';

async function seedTrails() {
  const mongoUri = resolveMongoUri();
  await connectDB(mongoUri);

  // Get or create a seed user
  let user = await User.findOne({ email: 'vikas@gmail.com' });
  if (!user) {
    user = await User.findOne({});
  }
  if (!user) {
    console.error('No users found. Register a user first.');
    process.exit(1);
  }

  const userId = user._id;

  const trails = [
    {
      title: 'Local MERN Stack Setup',
      slug: 'local-mern-stack-setup',
      description: 'Get the full-stack MERN application running locally from a fresh clone. Covers Node.js, MongoDB, environment setup, and first successful build.',
      category: 'setup',
      targetRoles: ['developer', 'devops'],
      platforms: ['windows', 'mac', 'linux'],
      prerequisites: ['Git installed', 'Node.js >= 18', 'MongoDB running or Atlas URI'],
      tags: ['mern', 'local-setup', 'onboarding', 'node'],
      steps: [
        {
          order: 1,
          title: 'Clone the repository',
          description: 'Clone the project repository to your local machine.',
          commands: {
            windows: 'git clone https://github.com/your-org/cortex.git\ncd cortex',
            mac: 'git clone https://github.com/your-org/cortex.git\ncd cortex',
            linux: 'git clone https://github.com/your-org/cortex.git\ncd cortex'
          },
          checkQuestion: 'Do you see the project folder with client/ and server/ directories?',
          onFailHint: 'Check your Git credentials and network access. Try: git config --global credential.helper store',
          cornerCases: ['VPN may block GitHub SSH', 'Corporate proxy needs git config http.proxy']
        },
        {
          order: 2,
          title: 'Install dependencies',
          description: 'Install all npm packages for both client and server.',
          commands: {
            windows: 'npm install',
            mac: 'npm install',
            linux: 'npm install'
          },
          checkQuestion: 'Did npm install complete without errors?',
          onFailHint: 'Try deleting node_modules and package-lock.json, then run npm install again. Check Node version: node --version (need >= 18)',
          cornerCases: ['node-gyp failures on Windows need Visual Studio Build Tools', 'Mac M1/M2 may need: arch -arm64 npm install', 'Behind proxy: npm config set proxy http://proxy:port']
        },
        {
          order: 3,
          title: 'Configure environment variables',
          description: 'Copy the env template and set your MongoDB URI and JWT secret.',
          commands: {
            windows: 'copy server\\.env.example server\\.env\n# Edit server\\.env with your MONGODB_URI and JWT_SECRET',
            mac: 'cp server/.env.example server/.env\n# Edit server/.env with your MONGODB_URI and JWT_SECRET',
            linux: 'cp server/.env.example server/.env\n# Edit server/.env with your MONGODB_URI and JWT_SECRET'
          },
          checkQuestion: 'Have you set MONGODB_URI and JWT_SECRET in server/.env?',
          onFailHint: 'For local MongoDB use: MONGODB_URI=mongodb://localhost:27017/wiki-manager. For JWT_SECRET use any random string (e.g., openssl rand -hex 32)',
          cornerCases: ['Atlas connection strings need IP whitelist', 'Special characters in password need URL encoding', 'WSL users: use host.docker.internal for Docker MongoDB']
        },
        {
          order: 4,
          title: 'Start Ollama (for AI features)',
          description: 'Start the Ollama service and pull required models.',
          commands: {
            windows: 'ollama serve\n# In another terminal:\nollama pull llama3.2\nollama pull nomic-embed-text',
            mac: 'ollama serve\n# In another terminal:\nollama pull llama3.2\nollama pull nomic-embed-text',
            linux: 'sudo systemctl start ollama\nollama pull llama3.2\nollama pull nomic-embed-text'
          },
          checkQuestion: 'Does "ollama list" show both llama3.2 and nomic-embed-text?',
          onFailHint: 'Install Ollama from https://ollama.com. On Windows, restart terminal after install. Check: curl http://localhost:11434/api/tags',
          cornerCases: ['Port 11434 may conflict with other services', 'First pull takes time (2GB+ download)', 'Corporate firewall may block model downloads']
        },
        {
          order: 5,
          title: 'Start the application',
          description: 'Run both frontend and backend simultaneously.',
          commands: {
            windows: 'npm run dev',
            mac: 'npm run dev',
            linux: 'npm run dev'
          },
          checkQuestion: 'Can you access http://localhost:5173 and see the login page?',
          onFailHint: 'Check if ports 3001 and 5173 are free: netstat -ano | findstr :3001 (Windows) or lsof -i :3001 (Mac/Linux). Kill any conflicting process.',
          cornerCases: ['Port already in use: change in vite.config.js or server .env', 'MongoDB connection timeout: check if mongod is running', 'EACCES on Mac: dont use sudo with npm']
        },
        {
          order: 6,
          title: 'Register and login',
          description: 'Create your first user account and verify authentication works.',
          commands: {
            windows: '# Open http://localhost:5173/register in browser\n# Create account, then login',
            mac: 'open http://localhost:5173/register',
            linux: 'xdg-open http://localhost:5173/register'
          },
          checkQuestion: 'Can you login and see the dashboard?',
          onFailHint: 'Check server logs for auth errors. Verify JWT_SECRET is set. Check MongoDB is accepting connections. Try: curl http://localhost:3001/api/health',
          cornerCases: ['Browser cache may show stale login page', 'JWT_SECRET mismatch between restarts causes token rejection']
        }
      ],
      records: [
        { user: userId, role: 'developer', platform: 'windows', completedSteps: [1, 2, 3, 4, 5, 6], success: true, duration: 25, notes: 'Smooth setup, Ollama pull took longest' },
        { user: userId, role: 'developer', platform: 'windows', completedSteps: [1, 2, 3], failedAt: 4, failReason: 'Ollama not installed, download page was blocked by corporate firewall', success: false, duration: 15 },
        { user: userId, role: 'developer', platform: 'mac', completedSteps: [1, 2, 3, 4, 5, 6], success: true, duration: 20, notes: 'Used brew install ollama, worked perfectly on M2' },
        { user: userId, role: 'devops', platform: 'linux', completedSteps: [1, 2, 3, 4, 5, 6], success: true, duration: 18, notes: 'Ubuntu 22.04, no issues' },
        { user: userId, role: 'developer', platform: 'windows', completedSteps: [1, 2], failedAt: 3, failReason: 'MONGODB_URI had special chars in password, needed URL encoding', success: false, duration: 30 },
        { user: userId, role: 'tester', platform: 'windows', completedSteps: [1, 2, 3, 4, 5, 6], success: true, duration: 35, notes: 'First time with Node.js, took a bit longer but trail was clear' }
      ],
      createdBy: userId
    },
    {
      title: 'Deploy to Production (Render)',
      slug: 'deploy-to-production-render',
      description: 'Deploy the full-stack application to Render with MongoDB Atlas. Covers environment configuration, build settings, and health check verification.',
      category: 'deploy',
      targetRoles: ['developer', 'devops'],
      platforms: ['windows', 'mac', 'linux'],
      prerequisites: ['Render account', 'MongoDB Atlas cluster', 'Git repo pushed to GitHub'],
      tags: ['deploy', 'render', 'production', 'ci-cd'],
      steps: [
        {
          order: 1,
          title: 'Create Render Web Service',
          description: 'Connect your GitHub repo to Render and create a new Web Service.',
          commands: {
            windows: '# Go to https://dashboard.render.com/new/web-service\n# Connect GitHub repo\n# Set Root Directory: server\n# Build Command: npm install\n# Start Command: node src/index.js',
            mac: '# Same as Windows — browser-based',
            linux: '# Same as Windows — browser-based'
          },
          checkQuestion: 'Is the Render service created and showing "Deploy in progress"?',
          onFailHint: 'Make sure your GitHub repo is public or you authorized Render to access private repos.',
          cornerCases: ['Free tier sleeps after 15 min inactivity', 'Need to set Node version: NODE_VERSION=18 in env']
        },
        {
          order: 2,
          title: 'Set environment variables',
          description: 'Add all required environment variables in the Render dashboard.',
          commands: {
            windows: '# In Render Dashboard > Environment:\nMONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/wiki-manager\nJWT_SECRET=your-production-secret\nNODE_ENV=production\nFRONTEND_URL=https://your-app.onrender.com',
            mac: '# Same as Windows — browser-based',
            linux: '# Same as Windows — browser-based'
          },
          checkQuestion: 'Are all env vars set in the Render dashboard?',
          onFailHint: 'Double check MONGODB_URI has the correct password and database name. Ensure Atlas IP whitelist includes 0.0.0.0/0 for Render.',
          cornerCases: ['Atlas requires IP whitelist — add 0.0.0.0/0 for cloud deployments', 'Render auto-redeploys on env var change']
        },
        {
          order: 3,
          title: 'Build frontend and deploy',
          description: 'Build the React frontend and ensure it is served by the Express backend.',
          commands: {
            windows: '# Render Build Command should be:\ncd client && npm install && npm run build && cd ../server && npm install',
            mac: '# Same build command',
            linux: '# Same build command'
          },
          checkQuestion: 'Does the deploy log show "Build successful" with no errors?',
          onFailHint: 'Check build logs for missing dependencies. Ensure package.json scripts are correct. Vite needs devDependencies installed (set NODE_ENV=development during build).',
          cornerCases: ['Render free tier has 512MB RAM — large builds may OOM', 'Set NODE_ENV=production only for start, not build']
        },
        {
          order: 4,
          title: 'Verify deployment',
          description: 'Check the health endpoint and try logging in.',
          commands: {
            windows: 'curl https://your-app.onrender.com/api/health',
            mac: 'curl https://your-app.onrender.com/api/health',
            linux: 'curl https://your-app.onrender.com/api/health'
          },
          checkQuestion: 'Does /api/health return {"status":"OK"} and can you login?',
          onFailHint: 'Check Render logs for startup errors. Common issue: MongoDB connection timeout (check Atlas IP whitelist). CORS errors mean FRONTEND_URL env is wrong.',
          cornerCases: ['First request after sleep takes 30-50s (cold start)', 'CORS issues: add Render URL to FRONTEND_URL env var']
        }
      ],
      records: [
        { user: userId, role: 'devops', platform: 'mac', completedSteps: [1, 2, 3, 4], success: true, duration: 20, notes: 'Straightforward once Atlas IP whitelist was set' },
        { user: userId, role: 'developer', platform: 'windows', completedSteps: [1, 2, 3], failedAt: 4, failReason: 'CORS error - forgot to set FRONTEND_URL env var', success: false, duration: 40 },
        { user: userId, role: 'developer', platform: 'windows', completedSteps: [1, 2, 3, 4], success: true, duration: 30, notes: 'Second attempt after fixing CORS' }
      ],
      createdBy: userId
    },
    {
      title: 'Running Integration Tests',
      slug: 'running-integration-tests',
      description: 'Run the API integration test suite locally against a test database. Covers test DB setup, running tests, and interpreting results.',
      category: 'test',
      targetRoles: ['tester', 'developer'],
      platforms: ['windows', 'mac', 'linux'],
      prerequisites: ['Local setup completed', 'MongoDB running', 'Node.js >= 18'],
      tags: ['testing', 'integration', 'api', 'quality'],
      steps: [
        {
          order: 1,
          title: 'Set up test database',
          description: 'Create a separate test database to avoid polluting development data.',
          commands: {
            windows: 'set MONGODB_URI=mongodb://localhost:27017/wiki-manager-test',
            mac: 'export MONGODB_URI=mongodb://localhost:27017/wiki-manager-test',
            linux: 'export MONGODB_URI=mongodb://localhost:27017/wiki-manager-test'
          },
          checkQuestion: 'Is the test database URI configured?',
          onFailHint: 'Make sure MongoDB is running. Check with: mongosh --eval "db.runCommand({ping:1})"',
          cornerCases: ['Dont use your production or dev DB for tests', 'Atlas free tier only allows 1 database — use local MongoDB for tests']
        },
        {
          order: 2,
          title: 'Seed test data',
          description: 'Run the seed script to populate test database with sample data.',
          commands: {
            windows: 'cd server && node src/scripts/seed.js',
            mac: 'cd server && node src/scripts/seed.js',
            linux: 'cd server && node src/scripts/seed.js'
          },
          checkQuestion: 'Did the seed script output "Seeded successfully"?',
          onFailHint: 'Check if MONGODB_URI is pointing to the test database. Verify the seed script exists in server/src/scripts/seed.js',
          cornerCases: ['Seed script may fail if collections already exist with unique constraints', 'Run with --force flag if available']
        },
        {
          order: 3,
          title: 'Run the test suite',
          description: 'Execute all API tests and review results.',
          commands: {
            windows: 'cd server && npm test',
            mac: 'cd server && npm test',
            linux: 'cd server && npm test'
          },
          checkQuestion: 'Did all tests pass (green)?',
          onFailHint: 'Check which tests failed. Common causes: stale test data (re-run seed), port conflicts (kill other server instances), missing env vars.',
          cornerCases: ['Async tests may timeout on slow machines — increase jest timeout', 'Tests that depend on Ollama will skip if not running']
        }
      ],
      records: [
        { user: userId, role: 'tester', platform: 'windows', completedSteps: [1, 2, 3], success: true, duration: 10, notes: 'All 24 tests passing' },
        { user: userId, role: 'developer', platform: 'mac', completedSteps: [1, 2, 3], success: true, duration: 8, notes: 'Fast on M2' },
        { user: userId, role: 'tester', platform: 'linux', completedSteps: [1, 2], failedAt: 3, failReason: 'Jest not installed as devDependency, needed npm install --include=dev', success: false, duration: 15 }
      ],
      createdBy: userId
    }
  ];

  // Clear existing trails
  await Trail.deleteMany({});
  console.log('Cleared existing trails.');

  // Insert trails
  for (const trailData of trails) {
    await Trail.create(trailData);
    console.log(`✅ Created trail: "${trailData.title}" (${trailData.steps.length} steps, ${trailData.records.length} records)`);
  }

  console.log(`\n🏔️  Sherpa seeded: ${trails.length} trails with real-world steps and attempt records.`);
  process.exit(0);
}

seedTrails().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
