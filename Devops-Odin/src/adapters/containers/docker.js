const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DockerAdapter {
  constructor(options = {}) {
    this.sshHost = options.sshHost || null;
    this.cwd = options.cwd || process.cwd();
  }

  formatCommand(command) {
    if (this.sshHost) {
      return `ssh ${this.sshHost} "${command.replace(/"/g, '\\"')}"`;
    }
    return command;
  }

  async inspectContainer(containerId) {
    const cmd = this.formatCommand(`docker inspect ${containerId}`);
    const { stdout } = await execAsync(cmd, { cwd: this.cwd });
    const parsed = JSON.parse(stdout);
    if (!parsed || !parsed.length) {
      throw new Error(`Container ${containerId} not found`);
    }
    const state = parsed[0].State || {};
    return {
      id: parsed[0].Id,
      name: parsed[0].Name,
      status: state.Status,
      running: state.Running,
      paused: state.Paused,
      restarting: state.Restarting,
      oomKilled: state.OOMKilled,
      exitCode: state.ExitCode,
      startedAt: state.StartedAt,
      finishedAt: state.FinishedAt
    };
  }

  async getContainerLogs(containerId, tailLines = 100) {
    const cmd = this.formatCommand(`docker logs --tail ${tailLines} ${containerId}`);
    try {
      const { stdout, stderr } = await execAsync(cmd, { cwd: this.cwd });
      return `${stdout}\n${stderr}`.trim();
    } catch (err) {
      return `${err.stdout || ''}\n${err.stderr || ''}`.trim();
    }
  }

  async restartContainer(containerId) {
    const cmd = this.formatCommand(`docker restart ${containerId}`);
    const { stdout } = await execAsync(cmd, { cwd: this.cwd });
    return { success: true, output: stdout.trim() };
  }

  async composeServiceAction(serviceDir, serviceName, action = 'restart') {
    const validActions = ['up -d', 'down', 'restart', 'stop'];
    const resolvedAction = validActions.find((a) => a === action || a.startsWith(action));
    if (!resolvedAction) {
      throw new Error(`Invalid compose action: ${action}`);
    }
    const baseCmd = `cd ${serviceDir} && docker compose ${resolvedAction} ${serviceName || ''}`.trim();
    const cmd = this.formatCommand(baseCmd);
    const { stdout, stderr } = await execAsync(cmd, { cwd: this.cwd });
    return { success: true, output: `${stdout}\n${stderr}`.trim() };
  }
}

module.exports = {
  DockerAdapter
};
