import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Allow self-signed certificates for local NAS deployment if specified
process.env.NODE_TLS_REJECT_UNAUTHORIZED = process.env.NODE_TLS_REJECT_UNAUTHORIZED ?? '0';

const NAS_HOST = process.env.NAS_HOST || '192.168.1.25';
const CLOUDCMD_URL = process.env.CLOUDCMD_URL || `http://${NAS_HOST}:8000`;
const PORTAINER_URL = process.env.PORTAINER_URL || `https://${NAS_HOST}:31015`;
const PORTAINER_USER = process.env.PORTAINER_USER || '';
const PORTAINER_PASS = process.env.PORTAINER_PASS || '';
const NAS_APP_PORT = process.env.NAS_APP_PORT ? parseInt(process.env.NAS_APP_PORT, 10) : 8091;
const LIVE_APP_URL = `http://${NAS_HOST}:${NAS_APP_PORT}`;

async function getPortainerToken(): Promise<string> {
  if (!PORTAINER_USER || !PORTAINER_PASS) {
    throw new Error(
      'Missing Portainer credentials. Please set PORTAINER_USER and PORTAINER_PASS in environment variables or .env file.'
    );
  }

  const res = await fetch(`${PORTAINER_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Username: PORTAINER_USER, Password: PORTAINER_PASS }),
  });
  if (!res.ok) {
    throw new Error(`Portainer Auth failed with status ${res.status}`);
  }
  const data = await res.json();
  return data.jwt;
}

async function execInCloudcmd(jwt: string, cmd: string) {
  const listRes = await fetch(`${PORTAINER_URL}/api/endpoints/3/docker/containers/json?all=true`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const containers = await listRes.json();
  const cloudcmd = containers.find((c: any) =>
    c.Names.some((n: string) => n.includes('cloudcmd'))
  );

  if (!cloudcmd) {
    throw new Error('cloudcmd container not found');
  }

  const createExecRes = await fetch(
    `${PORTAINER_URL}/api/endpoints/3/docker/containers/${cloudcmd.Id}/exec`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        AttachStdout: true,
        AttachStderr: true,
        Cmd: ['sh', '-c', cmd],
      }),
    }
  );
  const execData = await createExecRes.json();

  await fetch(`${PORTAINER_URL}/api/endpoints/3/docker/exec/${execData.Id}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Detach: false, Tty: false }),
  });
}

async function main() {
  if (!PORTAINER_USER || !PORTAINER_PASS) {
    console.error('\n❌ Error: Missing credentials!');
    console.error('Please run with environment variables:');
    console.error('PORTAINER_USER="<username>" PORTAINER_PASS="<password>" npm run deploy:nas\n');
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`🚢 DEPLOYING KIDS COLOURING APP TO NAS (${NAS_HOST})`);
  console.log(`Target URL: ${LIVE_APP_URL}`);
  console.log(`======================================================\n`);

  // Step 1: Package Release Tarball
  console.log('📦 Step 1: Packaging release files...');
  const tarballPath = '/tmp/kids-colouring-app.tar.gz';
  execSync(`tar -czf ${tarballPath} dist package.json`, { stdio: 'inherit' });
  const fileBytes = fs.readFileSync(tarballPath);
  console.log(`✅ Release tarball created: ${(fileBytes.length / 1024).toFixed(1)} KB`);

  // Step 2: Auth to Portainer & prep remote directory
  console.log('\n🔑 Step 2: Authenticating with Portainer...');
  const jwt = await getPortainerToken();
  console.log('✅ Portainer authentication successful');

  console.log('\n📂 Step 3: Preparing /Nas/Other/kids-colouring-app on NAS...');
  await execInCloudcmd(jwt, 'mkdir -p /Nas/Other/kids-colouring-app');

  // Step 4: Upload tarball via Cloudcmd API
  console.log('\n⬆️ Step 4: Uploading release tarball to NAS...');
  const uploadRes = await fetch(
    `${CLOUDCMD_URL}/api/v1/fs/Nas/Other/kids-colouring-app/kids-colouring-app.tar.gz`,
    {
      method: 'PUT',
      body: fileBytes,
    }
  );

  if (!uploadRes.ok) {
    throw new Error(`Cloudcmd upload failed with status ${uploadRes.status}`);
  }
  console.log('✅ Tarball uploaded successfully via Cloudcmd API');

  // Step 5: Extract release on NAS
  console.log('\n📂 Step 5: Extracting release on NAS...');
  await execInCloudcmd(
    jwt,
    'tar -xzf /Nas/Other/kids-colouring-app/kids-colouring-app.tar.gz -C /Nas/Other/kids-colouring-app'
  );
  console.log('✅ Extracted release files into /Nas/Other/kids-colouring-app');

  // Step 6: Create or update Portainer Stack
  console.log('\n🐳 Step 6: Checking Portainer Stack...');
  const stacksRes = await fetch(`${PORTAINER_URL}/api/stacks`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  const stacks = await stacksRes.json();
  const existingStack = stacks.find((s: any) => s.Name === 'kids-colouring-app');

  const stackCompose = `version: '3.8'

services:
  kids-colouring-app:
    image: node:22-alpine
    container_name: kids-colouring-app
    restart: unless-stopped
    ports:
      - "${NAS_APP_PORT}:8086"
    working_dir: /app
    volumes:
      - /mnt/nas/Other/kids-colouring-app:/app
    environment:
      - PUID=1000
      - PGID=1000
      - NODE_ENV=production
      - PORT=8086
    command: ["node", "dist/server.cjs"]
    healthcheck:
      test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://127.0.0.1:8086/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
`;

  if (existingStack) {
    console.log(`🔄 Updating existing Portainer stack (Id: ${existingStack.Id})...`);
    const updateRes = await fetch(
      `${PORTAINER_URL}/api/stacks/${existingStack.Id}?endpointId=3`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stackFileContent: stackCompose,
          env: [],
          prune: true,
        }),
      }
    );
    if (!updateRes.ok) {
      throw new Error(`Stack update failed with status ${updateRes.status}`);
    }
    console.log('✅ Stack updated successfully.');
  } else {
    console.log('🚀 Creating new Portainer stack kids-colouring-app on Endpoint 3...');
    const createRes = await fetch(
      `${PORTAINER_URL}/api/stacks/create/standalone/string?endpointId=3`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'kids-colouring-app',
          stackFileContent: stackCompose,
          env: [],
        }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Stack creation failed (${createRes.status}): ${errText}`);
    }
    console.log('✅ Portainer stack created successfully.');
  }

  // Step 7: Wait for warm up and probe health
  console.log('\n⏳ Step 7: Waiting 6 seconds for container to start & warm up...');
  await new Promise((r) => setTimeout(r, 6000));

  console.log(`\n🔍 Step 8: Probing health endpoint at ${LIVE_APP_URL}/api/health ...`);
  let attempts = 0;
  let healthy = false;

  while (attempts < 8) {
    attempts++;
    try {
      const healthRes = await fetch(`${LIVE_APP_URL}/api/health`);
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        console.log('✅ Health probe response:', healthData);
        healthy = true;
        break;
      }
    } catch {
      // Retry
    }
    console.log(`... waiting for container (attempt ${attempts}/8) ...`);
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!healthy) {
    throw new Error(`Failed to reach healthy status on ${LIVE_APP_URL}/api/health`);
  }

  console.log(`\n======================================================`);
  console.log(`🎉 NAS DEPLOYMENT COMPLETED & HEALTHY!`);
  console.log(`🌐 Live App URL: ${LIVE_APP_URL}`);
  console.log(`======================================================\n`);
}

main().catch((err) => {
  console.error('\n❌ Deployment failed:', err.message || err);
  process.exit(1);
});
