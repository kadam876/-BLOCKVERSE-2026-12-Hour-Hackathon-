import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((err) => {
  if (err) {
    console.error('❌ Email service not ready:', err.message);
    console.error('   Gmail requires an App Password: https://myaccount.google.com/apppasswords');
  } else {
    console.log('✅ Email service ready');
  }
});

// Generate smart suggestions based on department and crowd severity
function getSuggestions(authorityType, peopleCount, threshold) {
  const excess = peopleCount - threshold;
  const ratio = peopleCount / threshold;

  if (authorityType === 'transport') {
    const extraBuses = Math.ceil(excess / 40); // assume 40 people per bus
    return [
      `Deploy <strong>${extraBuses} additional bus${extraBuses > 1 ? 'es' : ''}</strong> to this route immediately`,
      'Activate crowd management staff at the bus stand entrance',
      'Consider opening alternate boarding zones to distribute the crowd',
      ratio >= 2
        ? 'Situation is critical — contact traffic police for road management support'
        : 'Monitor every 10 minutes and escalate if crowd continues to grow',
      'Update digital display boards with estimated wait times to manage expectations',
    ];
  } else {
    const units = Math.ceil(excess / 20); // assume 20 people per unit
    return [
      `Deploy <strong>${units} police unit${units > 1 ? 's' : ''}</strong> to the location immediately`,
      'Establish crowd control barriers at entry and exit points',
      ratio >= 2
        ? 'Declare the area as high-alert — request backup from nearest station'
        : 'Increase patrol frequency and monitor crowd movement',
      'Coordinate with local authorities to restrict further entry if needed',
      'Ensure emergency vehicle access routes remain clear',
    ];
  }
}

export async function sendAlertEmail({
  to,
  locationName,
  peopleCount,
  threshold,
  authorityType,
  frameNumber,
  frameImage, // base64 JPEG string
}) {
  const isPolice = authorityType === 'police';
  const excess = peopleCount - threshold;
  const ratio = (peopleCount / threshold).toFixed(1);
  const severity = peopleCount >= threshold * 2 ? 'CRITICAL' : peopleCount >= threshold * 1.5 ? 'HIGH' : 'MODERATE';
  const severityColor = severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#ea580c' : '#d97706';

  const suggestions = getSuggestions(authorityType, peopleCount, threshold);
  const suggestionsHtml = suggestions
    .map((s, i) => `<tr style="background:${i % 2 === 0 ? '#f9fafb' : 'white'}">
      <td style="padding:10px 14px;color:#374151;">
        <span style="color:${severityColor};font-weight:700;margin-right:8px;">${i + 1}.</span>${s}
      </td>
    </tr>`)
    .join('');

  const subject = `🚨 [${severity}] Crowd Alert — ${locationName} (${peopleCount} people / threshold: ${threshold})`;

  // Build attachments — image sent as both inline (cid) and regular attachment
  const attachments = [];
  if (frameImage) {
    const imgBuffer = Buffer.from(frameImage, 'base64');
    const filename = `alert_${locationName.replace(/\s+/g, '_')}_frame${frameNumber || ''}.jpg`;

    // Inline embed for email clients that support it
    attachments.push({
      filename,
      content: imgBuffer,
      contentType: 'image/jpeg',
      cid: 'alertframe',
    });

    // Regular attachment so it always appears as a downloadable .jpg
    attachments.push({
      filename,
      content: imgBuffer,
      contentType: 'image/jpeg',
    });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div style="background:${severityColor};padding:20px 24px;">
        <h1 style="color:white;margin:0;font-size:1.3rem;">🚨 Crowd Alert — ${severity} SEVERITY</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:0.9rem;">
          ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>

      <!-- Stats -->
      <div style="padding:20px 24px;background:#fff;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr style="background:#f9fafb;">
            <td style="padding:10px 14px;font-weight:600;color:#374151;width:45%;">Location</td>
            <td style="padding:10px 14px;font-weight:700;color:#111827;">${locationName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#374151;">People Detected</td>
            <td style="padding:10px 14px;font-weight:700;color:${severityColor};font-size:1.3rem;">${peopleCount}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Threshold Limit</td>
            <td style="padding:10px 14px;">${threshold} people</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Exceeded By</td>
            <td style="padding:10px 14px;font-weight:700;color:${severityColor};">+${excess} people (${ratio}x over limit)</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Authority</td>
            <td style="padding:10px 14px;">${isPolice ? '🚔 Police Station' : '🚌 Transport Authority'}</td>
          </tr>
          ${frameNumber ? `<tr>
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Detected at Frame</td>
            <td style="padding:10px 14px;">#${frameNumber}</td>
          </tr>` : ''}
        </table>

        ${frameImage ? `
        <div style="margin-bottom:20px;">
          <p style="font-weight:700;color:#374151;margin-bottom:8px;">📸 Frame at Time of Detection:</p>
          <img src="cid:alertframe"
            width="100%"
            style="width:100%;max-width:600px;border-radius:8px;border:2px solid ${severityColor};display:block;"
            alt="Alert frame — ${locationName} — ${peopleCount} people detected" />
          <p style="font-size:0.78rem;color:#9ca3af;margin-top:4px;">
            YOLO bounding boxes show detected individuals. If image does not display, see attached .jpg file.
          </p>
        </div>` : ''}

        <!-- Suggestions -->
        <div style="margin-bottom:20px;">
          <p style="font-weight:700;color:#374151;margin-bottom:8px;">
            ✅ Recommended Actions for ${isPolice ? 'Police' : 'Transport Authority'}:
          </p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
            ${suggestionsHtml}
          </table>
        </div>

        <!-- Severity note -->
        <div style="background:${severity === 'CRITICAL' ? '#fee2e2' : severity === 'HIGH' ? '#ffedd5' : '#fef3c7'};
          border-left:4px solid ${severityColor};padding:12px 16px;border-radius:4px;margin-bottom:16px;">
          <strong style="color:${severityColor};">Severity: ${severity}</strong><br/>
          <span style="font-size:0.88rem;color:#374151;">
            ${severity === 'CRITICAL'
              ? 'Immediate action required. Crowd is more than 2x the safe limit.'
              : severity === 'HIGH'
              ? 'Urgent response needed. Crowd is 1.5x the safe limit.'
              : 'Prompt attention required. Crowd has exceeded the safe limit.'}
          </span>
        </div>

        <p style="color:#9ca3af;font-size:0.78rem;margin:0;">
          This is an automated alert from the Crowd Detection System.<br/>
          Do not reply to this email. Contact your supervisor for escalation procedures.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Crowd Alert System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}


export async function sendFaceMatchEmail({
  to,
  suspectName,
  suspectDescription,
  locationName,
  confidence,
  snapshot,
  suspectImage,
}) {
  const confidencePct = (confidence * 100).toFixed(1);
  const severity = confidence >= 0.9 ? 'CRITICAL' : confidence >= 0.75 ? 'HIGH' : 'MODERATE';
  const severityColor = severity === 'CRITICAL' ? '#dc2626' : severity === 'HIGH' ? '#ea580c' : '#d97706';

  const subject = `🚨 [${severity}] Suspect Identified — ${suspectName} at ${locationName} (${confidencePct}% match)`;

  const attachments = [];
  
  // Attach snapshot
  if (snapshot) {
    attachments.push({
      filename: `match_${suspectName.replace(/\s+/g, '_')}.jpg`,
      content: Buffer.from(snapshot, 'base64'),
      contentType: 'image/jpeg',
      cid: 'matchframe',
    });
  }

  // Attach suspect reference image
  if (suspectImage && suspectImage.startsWith('data:image')) {
    const base64Data = suspectImage.split(',')[1];
    attachments.push({
      filename: `suspect_${suspectName.replace(/\s+/g, '_')}.jpg`,
      content: Buffer.from(base64Data, 'base64'),
      contentType: 'image/jpeg',
      cid: 'suspectref',
    });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

      <!-- Header -->
      <div style="background:${severityColor};padding:20px 24px;">
        <h1 style="color:white;margin:0;font-size:1.3rem;">🚨 Suspect Identified — ${severity} MATCH</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:0.9rem;">
          ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>

      <!-- Stats -->
      <div style="padding:20px 24px;background:#fff;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr style="background:#f9fafb;">
            <td style="padding:10px 14px;font-weight:600;color:#374151;width:45%;">Suspect Name</td>
            <td style="padding:10px 14px;font-weight:700;color:#111827;">${suspectName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Location</td>
            <td style="padding:10px 14px;">${locationName}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Match Confidence</td>
            <td style="padding:10px 14px;font-weight:700;color:${severityColor};font-size:1.3rem;">${confidencePct}%</td>
          </tr>
          ${suspectDescription ? `<tr>
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Description</td>
            <td style="padding:10px 14px;">${suspectDescription}</td>
          </tr>` : ''}
        </table>

        <!-- Images -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          ${snapshot ? `
          <div>
            <p style="font-weight:700;color:#374151;margin-bottom:8px;font-size:0.85rem;">📸 Detected Face:</p>
            <img src="cid:matchframe" width="100%" style="border-radius:8px;border:2px solid ${severityColor};" alt="Detected face" />
          </div>` : ''}
          ${suspectImage ? `
          <div>
            <p style="font-weight:700;color:#374151;margin-bottom:8px;font-size:0.85rem;">🎯 Reference Image:</p>
            <img src="cid:suspectref" width="100%" style="border-radius:8px;border:2px solid #9ca3af;" alt="Suspect reference" />
          </div>` : ''}
        </div>

        <!-- Actions -->
        <div style="background:${severity === 'CRITICAL' ? '#fee2e2' : severity === 'HIGH' ? '#ffedd5' : '#fef3c7'};
          border-left:4px solid ${severityColor};padding:12px 16px;border-radius:4px;margin-bottom:16px;">
          <strong style="color:${severityColor};">⚠️ Immediate Action Required</strong><br/>
          <span style="font-size:0.88rem;color:#374151;">
            ${severity === 'CRITICAL'
              ? 'High confidence match detected. Deploy units immediately to the location.'
              : severity === 'HIGH'
              ? 'Strong match detected. Verify identity and proceed with caution.'
              : 'Possible match detected. Investigate and confirm identity.'}
          </span>
        </div>

        <p style="color:#9ca3af;font-size:0.78rem;margin:0;">
          This is an automated alert from the Face Recognition System.<br/>
          Do not reply to this email. Contact your supervisor for escalation procedures.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Face Recognition Alert" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}

export async function sendVehicleWatchlistEmail({
  to,
  vehicleNumber,
  ownerName,
  vehicleType,
  color,
  locationName,
  timestamp,
  thumbnail,
}) {
  const subject = `🚨 [WATCHLIST] Vehicle Detected — ${vehicleNumber} at ${locationName}`;

  const attachments = [];
  if (thumbnail) {
    attachments.push({
      filename: `vehicle_${vehicleNumber}.jpg`,
      content: Buffer.from(thumbnail, 'base64'),
      contentType: 'image/jpeg',
      cid: 'vehicleframe',
    });
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <div style="background:#dc2626;padding:20px 24px;">
        <h1 style="color:white;margin:0;font-size:1.3rem;">🚨 Watchlist Vehicle Detected</h1>
        <p style="color:rgba(255,255,255,0.85);margin:6px 0 0;font-size:0.9rem;">
          ${new Date(timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
        </p>
      </div>

      <div style="padding:20px 24px;background:#fff;">
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr style="background:#f9fafb;">
            <td style="padding:10px 14px;font-weight:600;color:#374151;width:45%;">Vehicle Number</td>
            <td style="padding:10px 14px;font-weight:700;color:#111827;font-size:1.2rem;font-family:monospace;">${vehicleNumber}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Owner Name</td>
            <td style="padding:10px 14px;">${ownerName || 'Unknown'}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Location</td>
            <td style="padding:10px 14px;font-weight:700;">${locationName}</td>
          </tr>
          <tr>
            <td style="padding:10px 14px;font-weight:600;color:#374151;">Vehicle Details</td>
            <td style="padding:10px 14px;text-transform:capitalize;">${color || ''} ${vehicleType}</td>
          </tr>
        </table>

        ${thumbnail ? `
        <div style="margin-bottom:20px;">
          <p style="font-weight:700;color:#374151;margin-bottom:8px;">📸 Detection Snapshot:</p>
          <img src="cid:vehicleframe" width="100%" style="border-radius:8px;border:2px solid #dc2626;" alt="Detected vehicle" />
        </div>` : ''}

        <div style="background:#fee2e2;border-left:4px solid #dc2626;padding:12px 16px;border-radius:4px;margin-bottom:16px;">
          <strong style="color:#dc2626;">⚠️ Action Required</strong><br/>
          <span style="font-size:0.88rem;color:#374151;">
            A vehicle from your watchlist has been identified. Please verify and take appropriate action.
          </span>
        </div>

        <p style="color:#9ca3af;font-size:0.78rem;margin:0;">
          This is an automated alert from the Vehicle Tracking System.<br/>
          Do not reply to this email.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Vehicle Watchlist Alert" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    attachments,
  });
}
