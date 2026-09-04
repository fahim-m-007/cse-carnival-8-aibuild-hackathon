import { spawn, execSync } from 'child_process';
import path from 'path';
import net from 'net';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWin = process.platform === 'win32';

// Helper to kill any stray process on a port before launch
function freePortIfBusy(port) {
  try {
    if (isWin) {
      const output = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && Number(pid) > 0) {
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
            console.log(`[Port Manager] Freed port ${port} (terminated previous PID ${pid})`);
          } catch (e) {}
        }
      }
    }
  } catch (e) {
    // Port is already free
  }
}

console.log('====================================================');
console.log(' Starting CampusOS (Server + Client)...');
console.log('====================================================');

// Ensure ports 5000 and 5173 are free
freePortIfBusy(5000);
freePortIfBusy(5173);

const shellCmd = isWin ? 'cmd.exe' : 'sh';
const shellFlag = isWin ? '/c' : '-c';

// 1. Launch Server (Port 5000)
const server = spawn(shellCmd, [shellFlag, 'npm run dev'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit'
});

// 2. Launch Client (Port 5173)
const client = spawn(shellCmd, [shellFlag, 'npm run dev'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit'
});

const cleanup = () => {
  console.log('\nStopping CampusOS processes...');
  try { server.kill(); } catch (e) {}
  try { client.kill(); } catch (e) {}
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
