class AzureAdapter {
  constructor({ tenantId, clientId, clientSecret, subscriptionId }) {
    this.tenantId = tenantId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.subscriptionId = subscriptionId;
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  async getAccessToken() {
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) {
      return this.token;
    }
    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);
    params.append('scope', 'https://management.azure.com/.default');

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!response.ok) {
      throw new Error(`Azure OAuth authentication failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    return this.token;
  }

  async getResourceHealth(resourceId) {
    const token = await this.getAccessToken();
    const url = `https://management.azure.com${resourceId}/providers/Microsoft.ResourceHealth/availabilityStatuses/current?api-version=2022-10-01`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to query Azure Resource Health: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const props = data.properties || {};
    return {
      availabilityState: props.availabilityState,
      title: props.title,
      summary: props.summary,
      reasonType: props.reasonType,
      occuredTime: props.occuredTime
    };
  }

  async restartContainerApp(resourceGroupName, containerAppName) {
    const token = await this.getAccessToken();
    const url = `https://management.azure.com/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.App/containerApps/${containerAppName}/restart?api-version=2023-05-01`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok && response.status !== 202) {
      throw new Error(`Failed to restart Azure Container App: ${response.status} ${response.statusText}`);
    }

    return { success: true, status: response.status };
  }

  async restartVirtualMachine(resourceGroupName, vmName) {
    const token = await this.getAccessToken();
    const url = `https://management.azure.com/subscriptions/${this.subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.Compute/virtualMachines/${vmName}/restart?api-version=2023-09-01`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok && response.status !== 202) {
      throw new Error(`Failed to restart Azure Virtual Machine: ${response.status} ${response.statusText}`);
    }

    return { success: true, status: response.status };
  }
}

module.exports = {
  AzureAdapter
};
