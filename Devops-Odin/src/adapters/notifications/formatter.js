function formatHtmlEmail({ tenantConfig, diagnosticReport, approvalToken, webhookBaseUrl }) {
  const brand = tenantConfig.tenant || {
    displayName: 'Odin DevOps Co-Pilot',
    brandColor: '#0284c7',
    supportEmail: 'ops@example.com'
  };

  const approveUrl = `${webhookBaseUrl}/webhook/odin-approval?token=${encodeURIComponent(approvalToken)}&decision=approve`;
  const rejectUrl = `${webhookBaseUrl}/webhook/odin-approval?token=${encodeURIComponent(approvalToken)}&decision=reject`;

  const sevBadgeColor = {
    'SEV-1': '#dc2626',
    'SEV-2': '#ea580c',
    'SEV-3': '#eab308',
    'SEV-4': '#3b82f6'
  }[diagnosticReport.severity] || '#64748b';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${diagnosticReport.severity} - ${diagnosticReport.service} Incident</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
    <tr>
      <td style="background-color: ${brand.brandColor}; padding: 20px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 600;">${brand.displayName}</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Autonomous SRE Incident Alert</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <div style="display: inline-block; background-color: ${sevBadgeColor}; color: #ffffff; font-size: 12px; font-weight: 700; padding: 4px 8px; border-radius: 4px; margin-bottom: 12px;">
          ${diagnosticReport.severity}
        </div>
        <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 18px;">${diagnosticReport.summary}</h3>
        
        <table width="100%" style="margin-bottom: 20px; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; width: 120px;">Service:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${diagnosticReport.service}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Environment:</td>
            <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${diagnosticReport.environment}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Incident ID:</td>
            <td style="padding: 6px 0; font-family: monospace; color: #0f172a;">${diagnosticReport.incidentId}</td>
          </tr>
        </table>

        <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 12px 16px; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Root Cause Analysis</p>
          <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.5;">${diagnosticReport.rootCause}</p>
        </div>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 6px; margin-bottom: 24px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase;">Proposed Remediation</p>
          <p style="margin: 0 0 12px 0; font-size: 14px; color: #0f172a; font-weight: 600;">${diagnosticReport.recommendedAction.type}</p>
          <p style="margin: 0; font-size: 13px; color: #64748b;">${diagnosticReport.recommendedAction.recommendation || ''}</p>
        </div>

        ${diagnosticReport.recommendedAction.requiresApproval ? `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px;">
          <tr>
            <td align="center" style="padding-right: 8px;">
              <a href="${approveUrl}" style="display: block; width: 100%; text-align: center; background-color: #16a34a; color: #ffffff; padding: 12px 0; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Approve Action</a>
            </td>
            <td align="center" style="padding-left: 8px;">
              <a href="${rejectUrl}" style="display: block; width: 100%; text-align: center; background-color: #64748b; color: #ffffff; padding: 12px 0; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Reject</a>
            </td>
          </tr>
        </table>
        <p style="margin-top: 12px; font-size: 11px; color: #94a3b8; text-align: center;">Approval token valid for 15 minutes. Cryptographically signed by ${brand.displayName}.</p>
        ` : ''}
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; font-size: 12px; color: #94a3b8; text-align: center;">
        Need assistance? Contact <a href="mailto:${brand.supportEmail}" style="color: ${brand.brandColor}; text-decoration: none;">${brand.supportEmail}</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatSlackCard({ diagnosticReport, approveUrl, rejectUrl }) {
  return {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 [${diagnosticReport.severity}] ${diagnosticReport.service} Incident`
        }
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Environment:*\n${diagnosticReport.environment}` },
          { type: 'mrkdwn', text: `*Incident ID:*\n\`${diagnosticReport.incidentId}\`` }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Root Cause:*\n${diagnosticReport.rootCause}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Action:*\n\`${diagnosticReport.recommendedAction.type}\``
        }
      },
      ...(diagnosticReport.recommendedAction.requiresApproval
        ? [
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Approve Action' },
                  style: 'primary',
                  url: approveUrl
                },
                {
                  type: 'button',
                  text: { type: 'plain_text', text: 'Reject' },
                  style: 'danger',
                  url: rejectUrl
                }
              ]
            }
          ]
        : [])
    ]
  };
}

module.exports = {
  formatHtmlEmail,
  formatSlackCard
};
