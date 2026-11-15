class GitHubAdapter {
  constructor(token) {
    this.token = token;
    this.baseUrl = 'https://api.github.com';
  }

  getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Odin-DevOps-SRE-Bot'
    };
  }

  async getWorkflowRunLogs(owner, repo, runId) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/actions/runs/${runId}/logs`;
    const response = await fetch(url, { headers: this.getHeaders() });
    if (!response.ok) {
      throw new Error(`Failed to fetch workflow logs: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  async postCommentOnPullRequest(owner, repo, prNumber, commentBody) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${prNumber}/comments`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: commentBody })
    });
    if (!response.ok) {
      throw new Error(`Failed to post comment on PR: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  async dispatchWorkflow(owner, repo, workflowId, ref, inputs = {}) {
    const url = `${this.baseUrl}/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref, inputs })
    });
    if (!response.ok) {
      throw new Error(`Failed to dispatch workflow: ${response.status} ${response.statusText}`);
    }
    return { success: true };
  }
}

module.exports = {
  GitHubAdapter
};
