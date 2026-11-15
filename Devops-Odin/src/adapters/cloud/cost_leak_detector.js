const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

const ESTIMATED_COSTS = {
  AZURE_UNATTACHED_DISK_P10_MONTHLY: 19.71,
  AZURE_UNUSED_STATIC_IP_MONTHLY: 3.65,
  DOCKER_GB_STORAGE_MONTHLY: 0.10
};

class CostLeakDetector {
  constructor(azureAdapter = null) {
    this.azureAdapter = azureAdapter;
  }

  async scanAzureLeaks(subscriptionId, resourceGroupName) {
    if (!this.azureAdapter) {
      return { leaks: [], estimatedMonthlyWasteUsd: 0 };
    }

    const token = await this.azureAdapter.getAccessToken();
    const disksUrl = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/disks?api-version=2023-04-02`;
    
    const response = await fetch(disksUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to query Azure disks: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const disks = data.value || [];
    const leaks = [];
    let monthlyWaste = 0;

    for (const disk of disks) {
      const isUnattached = !disk.managedBy && disk.properties?.diskState === 'Unattached';
      if (isUnattached) {
        const sizeGb = disk.properties?.diskSizeGB || 128;
        const estimatedCost = ESTIMATED_COSTS.AZURE_UNATTACHED_DISK_P10_MONTHLY;
        monthlyWaste += estimatedCost;
        leaks.push({
          type: 'azure_unattached_disk',
          resourceId: disk.id,
          name: disk.name,
          sizeGb,
          estimatedMonthlyWasteUsd: estimatedCost,
          actionRequired: 'Delete unattached managed disk'
        });
      }
    }

    return {
      provider: 'azure',
      leaks,
      totalLeaksCount: leaks.length,
      estimatedMonthlyWasteUsd: Number(monthlyWaste.toFixed(2))
    };
  }

  async scanDockerLeaks() {
    const leaks = [];
    let totalReclaimableBytes = 0;

    try {
      const { stdout: dfOut } = await execAsync('docker system df --format "{{json .}}"');
      const lines = dfOut.trim().split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const item = JSON.parse(line);
          const reclaimable = item.Reclaimable || '0B';
          if (item.Type === 'Images' && parseInt(item.Active, 10) < parseInt(item.Total, 10)) {
            leaks.push({
              type: 'docker_dangling_images',
              totalItems: parseInt(item.Total, 10),
              activeItems: parseInt(item.Active, 10),
              reclaimableRaw: reclaimable,
              actionRequired: 'docker image prune -f'
            });
          }
          if (item.Type === 'Local Volumes' && parseInt(item.Active, 10) < parseInt(item.Total, 10)) {
            leaks.push({
              type: 'docker_unused_volumes',
              totalItems: parseInt(item.Total, 10),
              activeItems: parseInt(item.Active, 10),
              reclaimableRaw: reclaimable,
              actionRequired: 'docker volume prune -f'
            });
          }
        } catch {
          continue;
        }
      }
    } catch {
      return { provider: 'docker', leaks: [], estimatedMonthlyWasteUsd: 0 };
    }

    const estimatedWasteUsd = leaks.length > 0 ? 15.00 : 0.00;

    return {
      provider: 'docker',
      leaks,
      totalLeaksCount: leaks.length,
      estimatedMonthlyWasteUsd: estimatedWasteUsd
    };
  }

  generateCombinedReport(azureReport, dockerReport) {
    const allLeaks = [...(azureReport.leaks || []), ...(dockerReport.leaks || [])];
    const totalSavings = (azureReport.estimatedMonthlyWasteUsd || 0) + (dockerReport.estimatedMonthlyWasteUsd || 0);

    return {
      reportId: `cost_${Date.now()}`,
      timestamp: new Date().toISOString(),
      totalLeaksFound: allLeaks.length,
      projectedAnnualSavingsUsd: Number((totalSavings * 12).toFixed(2)),
      projectedMonthlySavingsUsd: Number(totalSavings.toFixed(2)),
      breakdown: {
        azure: azureReport,
        docker: dockerReport
      }
    };
  }
}

module.exports = {
  CostLeakDetector,
  ESTIMATED_COSTS
};
