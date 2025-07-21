#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Start the server
const server = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: 'inherit'
});

// Start Vite dev server  
const vite = spawn('npx', ['vite', '--host', '0.0.0.0'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  server.kill();
  vite.kill();
  process.exit(0);
});