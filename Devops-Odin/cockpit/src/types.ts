export interface AzureResource {
  id: string;
  name: string;
  type: string;
  resourceGroup: string;
  location: string;
  status: 'Running' | 'Online' | 'Succeeded' | 'Degraded';
  url?: string;
  details?: string;
}

export interface IncidentRecord {
  auditId: string;
  timestamp: string;
  stage: 'INGRESS_AND_TRIAGE' | 'APPROVAL_EXECUTED' | 'REMEDIATION_TRIGGERED';
  service: string;
  severity: 'SEV-1' | 'SEV-2' | 'SEV-3';
  category: string;
  sanitizedLogsSample?: string;
  decision?: 'approve' | 'reject';
  executedBy?: string;
}

export interface ApprovalAction {
  actionId: string;
  incidentId: string;
  service: string;
  severity: 'SEV-1' | 'SEV-2';
  title: string;
  rootCause: string;
  proposedAction: string;
  expiresInMinutes: number;
}

export interface PipelineStep {
  stage: number;
  name: string;
  status: 'COMPLETED' | 'RUNNING' | 'BLOCKED' | 'PENDING';
  durationMs: number;
  details: string;
  payload?: any;
}

export interface ShowcaseExecution {
  id: string;
  timestamp: string;
  channel: string;
  sender: string;
  input: string;
  output: string;
  toolCalled: string;
  status: 'SUCCESS' | 'BLOCKED' | 'ERROR';
  latencyMs: number;
  tokens: number;
  costUsd: number;
  guardrailStatus: string;
  steps?: PipelineStep[];
}

export interface TestCase {
  id: string;
  category: string;
  name: string;
  prompt: string;
  expectedKeyword: string;
  expectedTool: string;
  assertion: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  latencyMs: number;
  actualOutput?: string;
  actualTool?: string;
}

export interface AnalyticsData {
  successRate: string;
  avgLatencyMs: number;
  totalExecutions: number;
  totalTokensTracked: number;
  estimatedCostUsd: number;
  guardrailRejectionCount: number;
  activeChannels: string[];
}
