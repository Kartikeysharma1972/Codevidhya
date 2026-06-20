// pm2 process definitions for all four Codevidhya apps on a single box.
// Used by deploy-apps.sh:  pm2 startOrReload deploy/aws/ecosystem.config.cjs
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

module.exports = {
  apps: [
    {
      name: 'cv-portal',
      cwd: path.join(ROOT, 'codevidhya-portal', 'server'),
      script: 'server.js',
      env: { NODE_ENV: 'production', PORT: '4000' },
      max_memory_restart: '400M',
    },
    {
      name: 'cv-ai-tutor',
      cwd: path.join(ROOT, 'student', 'Ai Tutor', 'server'),
      script: 'server.js',
      env: { NODE_ENV: 'production', PORT: '5000' },
      max_memory_restart: '450M',
    },
    {
      name: 'cv-admin',
      cwd: path.join(ROOT, 'Admin tool', 'server'),
      script: 'server.js',
      env: { NODE_ENV: 'production', PORT: '5001' },
      max_memory_restart: '300M',
    },
    {
      name: 'cv-classroom',
      cwd: path.join(ROOT, 'teacher', 'classroom-ai-main', 'backend'),
      script: path.join(ROOT, 'deploy', 'aws', 'start-classroom.sh'),
      interpreter: 'bash',
      env: { NODE_ENV: 'production', PORT: '8001' },
      max_memory_restart: '700M',
    },
  ],
};
