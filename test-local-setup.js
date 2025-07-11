#!/usr/bin/env node

/**
 * Test script to verify local development setup
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Testing Local Development Setup...\n');

// Test 1: Check if npm scripts are available
console.log('✅ Checking available npm scripts...');
const packageJson = require('./package.json');
const requiredScripts = ['dev:local', 'backend:dev', 'frontend:dev'];
const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);

if (missingScripts.length > 0) {
  console.log('❌ Missing required scripts:', missingScripts);
  process.exit(1);
} else {
  console.log('✅ All required scripts are available');
}

// Test 2: Check if concurrently is installed
console.log('\n✅ Checking if concurrently is installed...');
try {
  require('concurrently');
  console.log('✅ concurrently is installed');
} catch (error) {
  console.log('❌ concurrently is not installed. Run: npm install');
  process.exit(1);
}

// Test 3: Check backend dependencies
console.log('\n✅ Checking backend dependencies...');
const backendPackageJson = require('./backend/package.json');
const requiredBackendDeps = ['tsx', 'express', 'cors'];
const missingBackendDeps = requiredBackendDeps.filter(dep => 
  !backendPackageJson.dependencies[dep] && !backendPackageJson.devDependencies[dep]
);

if (missingBackendDeps.length > 0) {
  console.log('❌ Missing backend dependencies:', missingBackendDeps);
  console.log('Run: cd backend && npm install');
  process.exit(1);
} else {
  console.log('✅ Backend dependencies are available');
}

// Test 4: Check frontend dependencies
console.log('\n✅ Checking frontend dependencies...');
const frontendPackageJson = require('./voice-ai-task-manager/package.json');
const requiredFrontendDeps = ['vite', 'react'];
const missingFrontendDeps = requiredFrontendDeps.filter(dep => 
  !frontendPackageJson.dependencies[dep] && !frontendPackageJson.devDependencies[dep]
);

if (missingFrontendDeps.length > 0) {
  console.log('❌ Missing frontend dependencies:', missingFrontendDeps);
  console.log('Run: cd voice-ai-task-manager && npm install');
  process.exit(1);
} else {
  console.log('✅ Frontend dependencies are available');
}

console.log('\n🎉 Local development setup verification complete!');
console.log('\n📋 Next Steps:');
console.log('1. Ensure PostgreSQL is running');
console.log('2. Ensure Redis is running');
console.log('3. Set up environment variables in backend/.env and voice-ai-task-manager/.env');
console.log('4. Run: npm run dev:local');
console.log('5. Open http://localhost:5173 in your browser');
console.log('\n📖 See README_LOCAL_DEV.md for detailed instructions');
