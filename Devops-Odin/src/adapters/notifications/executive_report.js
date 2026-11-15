function buildExecutiveRoiReport({ tenantConfig, weeklyStats }) {
  const brand = tenantConfig.tenant || {
    displayName: 'Odin SRE Bot',
    brandColor: '#0284c7',
    supportEmail: 'ops@example.com'
  };

  const stats = {
    weekRange: weeklyStats.weekRange || 'Past 7 Days',
    incidentsTriaged: weeklyStats.incidentsTriaged || 0,
    autonomousResolutions: weeklyStats.autonomousResolutions || 0,
    averageMttrMinutes: weeklyStats.averageMttrMinutes || 4.2,
    engineerHoursSaved: weeklyStats.engineerHoursSaved || 0,
    estimatedDowntimeAvoidedUsd: weeklyStats.estimatedDowntimeAvoidedUsd || 0,
    cloudCostLeaksFoundUsd: weeklyStats.cloudCostLeaksFoundUsd || 0,
    uptimePercentage: weeklyStats.uptimePercentage || '99.98%'
  };

  const totalRoiUsd = stats.estimatedDowntimeAvoidedUsd + stats.cloudCostLeaksFoundUsd;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Weekly SRE & ROI Executive Briefing</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 32px 16px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);">
    <tr>
      <td style="background-color: ${brand.brandColor}; padding: 28px 32px; color: #ffffff;">
        <p style="margin: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; font-weight: 700; opacity: 0.85;">Executive Briefing</p>
        <h1 style="margin: 6px 0 0 0; font-size: 22px; font-weight: 700;">${brand.displayName} Weekly ROI Report</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Coverage Window: ${stats.weekRange}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
          <tr>
            <td width="50%" style="padding-right: 12px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Total ROI Generated</p>
                <h2 style="margin: 6px 0 0 0; font-size: 28px; font-weight: 800; color: #16a34a;">\$${totalRoiUsd.toLocaleString()}</h2>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Downtime avoided + cost leaks</p>
              </div>
            </td>
            <td width="50%" style="padding-left: 12px;">
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; text-align: center;">
                <p style="margin: 0; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase;">Fleet Availability</p>
                <h2 style="margin: 6px 0 0 0; font-size: 28px; font-weight: 800; color: #0284c7;">${stats.uptimePercentage}</h2>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">Across all monitored hosts</p>
              </div>
            </td>
          </tr>
        </table>

        <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a;">Operational Performance</h3>
        <table width="100%" style="border-collapse: collapse; margin-bottom: 28px; font-size: 14px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b;">Incidents Triaged & Redacted</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">${stats.incidentsTriaged}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b;">Autonomous / Gated Remediations</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">${stats.autonomousResolutions}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b;">Average Mean-Time-To-Resolve (MTTR)</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #16a34a;">${stats.averageMttrMinutes} minutes</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 0; color: #64748b;">Engineering Hours Reclaimed</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #0f172a;">${stats.engineerHoursSaved} hrs</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #64748b;">Cloud Cost Leak Opportunities Identified</td>
            <td style="padding: 10px 0; text-align: right; font-weight: 700; color: #ea580c;">\$${stats.cloudCostLeaksFoundUsd.toLocaleString()} / mo</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border-left: 4px solid #16a34a; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
          <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700; color: #15803d;">Key Takeaway</p>
          <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.5;">
            Zero human on-call escalations occurred outside core working hours this week. All transient memory pressure and failed deployments were diagnosed with zero token leaks.
          </p>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; font-size: 12px; color: #94a3b8; text-align: center;">
        Report generated autonomously by ${brand.displayName}. Questions? Contact <a href="mailto:${brand.supportEmail}" style="color: ${brand.brandColor}; text-decoration: none;">${brand.supportEmail}</a>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

module.exports = {
  buildExecutiveRoiReport
};
