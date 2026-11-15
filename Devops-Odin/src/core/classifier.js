const CATEGORY_MAP = [
  {
    category: 'oom_killed',
    severity: 'SEV-1',
    riskLevel: 'HIGH',
    triggers: ['exit code 137', 'out of memory', 'oomkilled', 'cgroup out of memory', 'heap out of memory'],
    recommendation: 'Increase memory limits in container/pod manifest and inspect recent heap allocation profiles.'
  },
  {
    category: 'segmentation_fault',
    severity: 'SEV-1',
    riskLevel: 'HIGH',
    triggers: ['exit code 139', 'segfault', 'segmentation fault', 'core dumped'],
    recommendation: 'Inspect native library bindings and trace binary memory corruption.'
  },
  {
    category: 'authentication',
    severity: 'SEV-2',
    riskLevel: 'MEDIUM',
    triggers: ['401', '403', 'unauthorized', 'forbidden', 'bad credentials', 'invalid token', 'access denied'],
    recommendation: 'Validate secret rotation status, service principal permissions, and API key expiration.'
  },
  {
    category: 'rate_limited',
    severity: 'SEV-3',
    riskLevel: 'LOW',
    triggers: ['429', 'too many requests', 'rate limit exceeded', 'quota exceeded'],
    recommendation: 'Implement exponential backoff retry policy and inspect upstream rate limits.'
  },
  {
    category: 'network_unreachable',
    severity: 'SEV-2',
    riskLevel: 'MEDIUM',
    triggers: ['econnrefused', 'ehostunreach', 'etimedout', 'dns', 'no route to host', '502', '503', '504'],
    recommendation: 'Check target service health, VPC routing, DNS resolution, and security group egress rules.'
  },
  {
    category: 'build_compilation',
    severity: 'SEV-3',
    riskLevel: 'LOW',
    triggers: ['syntaxerror', 'cannot find module', 'compilation failed', 'typescript error', 'pip install failed'],
    recommendation: 'Review the failing commit diff, package-lock dependency resolution, or base image version.'
  }
];

function classifyIncident(rawTrace, exitCode = null) {
  const text = `${exitCode ? `exit code ${exitCode} ` : ''}${String(rawTrace || '')}`.toLowerCase();

  for (const rule of CATEGORY_MAP) {
    if (rule.triggers.some((pattern) => text.includes(pattern))) {
      return {
        category: rule.category,
        severity: rule.severity,
        riskLevel: rule.riskLevel,
        recommendation: rule.recommendation,
        requiresApproval: rule.riskLevel !== 'LOW'
      };
    }
  }

  return {
    category: 'general_runtime_error',
    severity: 'SEV-2',
    riskLevel: 'MEDIUM',
    recommendation: 'Inspect structured logs and reproduce the failure under isolated staging conditions.',
    requiresApproval: true
  };
}

module.exports = {
  classifyIncident
};
