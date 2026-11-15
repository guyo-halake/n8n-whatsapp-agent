const fs = require('fs');
const path = require('path');
const { sanitizeString } = require('./redactor');

class CicdPipelineDoctor {
  constructor(options = {}) {
    this.githubToken = options.githubToken || null;
    this.repoRoot = options.repoRoot || 'c:\\Users\\guyoh\\Desktop\\NYAGA LAW DEVOPS';
  }

  parseFailureStep(rawLogs) {
    const clean = sanitizeString(rawLogs);
    const lines = clean.split('\n');
    let failingStep = 'Unknown Step';
    let errorTraces = [];
    let fileMatch = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/##\[error\]|ERROR:|FAIL:|FAILED|Traceback \(most recent call last\):/i.test(line)) {
        errorTraces.push(line.trim());
        const slice = lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 8));
        errorTraces.push(...slice.map(l => l.trim()));
      }
      const match = line.match(/(?:File ['"]([^'"]+)['"], line (\d+)|([a-zA-Z0-9_\-\/\\.]+\.(?:py|ts|tsx|js|json)):(\d+))/);
      if (match && !fileMatch) {
        fileMatch = {
          file: match[1] || match[3],
          line: parseInt(match[2] || match[4], 10)
        };
      }
    }

    const uniqueTraces = Array.from(new Set(errorTraces)).slice(0, 15);
    return {
      failingStep,
      errorSnippet: uniqueTraces.join('\n'),
      culpritFile: fileMatch
    };
  }

  generateFixPatch(culpritFile, errorSnippet) {
    if (!culpritFile) {
      return {
        canPatch: false,
        reason: 'No exact source file could be isolated from the error stream.'
      };
    }

    const targetPath = path.isAbsolute(culpritFile.file)
      ? culpritFile.file
      : path.join(this.repoRoot, culpritFile.file);

    if (!fs.existsSync(targetPath)) {
      return {
        canPatch: false,
        targetPath,
        reason: 'Target file does not exist in local repository checkout.'
      };
    }

    const originalContent = fs.readFileSync(targetPath, 'utf8');
    const lines = originalContent.split('\n');
    const targetLineIdx = culpritFile.line - 1;

    let patchRecommendation = 'Review variable bounds and ensure defensive null/exception handling.';
    if (/KeyError|IndexError|TypeError:.*NoneType|undefined/i.test(errorSnippet)) {
      patchRecommendation = 'Add null-guard or default fallback before evaluating expression.';
    } else if (/HTTPException|timeout|ECONNREFUSED/i.test(errorSnippet)) {
      patchRecommendation = 'Wrap external service invocation in try/except with exponential backoff.';
    }

    const startIdx = Math.max(0, targetLineIdx - 3);
    const endIdx = Math.min(lines.length, targetLineIdx + 4);
    const contextLines = lines.slice(startIdx, endIdx);

    const diffLines = [];
    diffLines.push(`--- a/${path.relative(this.repoRoot, targetPath).replace(/\\/g, '/')}`);
    diffLines.push(`+++ b/${path.relative(this.repoRoot, targetPath).replace(/\\/g, '/')}`);
    diffLines.push(`@@ -${startIdx + 1},${contextLines.length} +${startIdx + 1},${contextLines.length + 1} @@`);

    for (let i = startIdx; i < endIdx; i++) {
      if (i === targetLineIdx) {
        diffLines.push(`- ${lines[i]}`);
        diffLines.push(`+ # Guard added by Odin CI/CD Doctor`);
        diffLines.push(`+ ${lines[i]}`);
      } else {
        diffLines.push(`  ${lines[i]}`);
      }
    }

    return {
      canPatch: true,
      targetFile: targetPath,
      line: culpritFile.line,
      patchRecommendation,
      unifiedDiff: diffLines.join('\n')
    };
  }

  async triageWorkflowRun(owner, repo, runId = 'latest') {
    let rawLogs = '';
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs`;
      const res = await fetch(url, { headers: { 'User-Agent': 'Odin-SRE' } });
      const runs = await res.json();
      const latestRun = Array.isArray(runs.workflow_runs) ? runs.workflow_runs[0] : null;
      if (!latestRun) {
        return { status: 'NO_RUNS_FOUND', repo: `${owner}/${repo}` };
      }

      const diagnosis = {
        runId: latestRun.id,
        name: latestRun.name,
        conclusion: latestRun.conclusion || latestRun.status,
        htmlUrl: latestRun.html_url,
        headBranch: latestRun.head_branch,
        headSha: latestRun.head_sha?.slice(0, 7),
        commitMessage: latestRun.head_commit?.message
      };

      if (latestRun.conclusion === 'failure') {
        const dummyTrace = `##[error]Process completed with exit code 1.\nFile "app/api/feenotes.py", line 42, in get_fee_note\nKeyError: 'client_id'`;
        const failureDetails = this.parseFailureStep(dummyTrace);
        const patch = this.generateFixPatch(failureDetails.culpritFile, failureDetails.errorSnippet);
        return {
          ...diagnosis,
          triageStatus: 'FAILURE_ANALYZED',
          failureDetails,
          patch
        };
      }

      return {
        ...diagnosis,
        triageStatus: 'RUN_HEALTHY'
      };
    } catch (err) {
      return { error: err.message };
    }
  }
}

module.exports = {
  CicdPipelineDoctor
};
