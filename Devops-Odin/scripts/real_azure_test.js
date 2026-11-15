const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function runRealAzureCheck() {
  console.log('=== REAL AZURE LIVE AUDIT ===\n');

  console.log('[1] Checking Azure CLI Active Account...');
  const { stdout: accountOut } = await execAsync('az account show --output json');
  const account = JSON.parse(accountOut);
  console.log(`Connected to Subscription: ${account.name} (${account.id})`);
  console.log(`Signed in User: ${account.user.name}`);
  console.log(`Tenant ID: ${account.tenantId}\n`);

  console.log('[2] Auditing Live Resource Group rg-nyagah-fee...');
  const { stdout: resOut } = await execAsync('az resource list --resource-group rg-nyagah-fee --output json');
  const resources = JSON.parse(resOut);
  console.log(`Found ${resources.length} active cloud resources:`);
  for (const r of resources) {
    console.log(` - [${r.type}] ${r.name} (${r.location})`);
  }

  console.log('\n[3] Querying Live Health State for App Service nyagah-b-fee-notes...');
  const { stdout: appOut } = await execAsync('az webapp show --name nyagah-b-fee-notes --resource-group rg-nyagah-fee --output json');
  const app = JSON.parse(appOut);
  console.log(`State: ${app.state}`);
  console.log(`Default Hostname: https://${app.defaultHostName}`);
  const plan = (app.serverFarmId || app.appServicePlanId || '').split('/').pop() || 'N/A';
  console.log(`App Service Plan: ${plan}`);

  console.log('\n[4] Scanning for Unattached Disks (Cost Leak Audit)...');
  const { stdout: diskOut } = await execAsync('az disk list --resource-group rg-nyagah-fee --output json');
  const disks = JSON.parse(diskOut);
  const unattached = disks.filter(d => !d.managedBy);
  if (unattached.length === 0) {
    console.log('Zero unattached disks detected. No disk storage leakage in rg-nyagah-fee.');
  } else {
    console.log(`WARNING: Detected ${unattached.length} unattached disk(s)!`);
  }

  console.log('\n=== REAL AZURE AUDIT COMPLETED SUCCESSFULLY ===');
}

runRealAzureCheck().catch(err => {
  console.error('Azure check failed:', err.message);
  process.exit(1);
});
