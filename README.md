

---

## Start Guide

### 1. Run WhatsApp Gateway (WAHA) with Docker
WAHA provides a clean REST API for WhatsApp without monthly API fees or per-conversation Meta pricing.

Run in PowerShell or terminal:
```bash
docker run -d --name waha \
  -p 5000:3000/tcp \
  -e WAHA_DASHBOARD_NO_PASSWORD=true \
  -e WAHA_NO_API_KEY=true \
  -e WAHA_WEBHOOK_URL=https://<your-n8n-instance>/webhook/whatsapp-odin-inbound \
  -e WAHA_WEBHOOK_EVENTS=message \
  --restart unless-stopped \
  devlikeapro/waha
```

### 2. Pair Your WhatsApp Number
1. Navigate to `http://localhost:5000/dashboard`.
2. Start session `default` using the **NOWEB** engine.
3. Enter your phone number (e.g., `254141888585`) to generate an 8-character pairing code.
4. On your phone: Open WhatsApp > **Settings > Linked Devices > Link a Device > Link with phone number instead** and enter the code.
5. Your session will transition to **WORKING**.

### 3. Expose Local WAHA to n8n Cloud (via Cloudflare Tunnel)
If your n8n instance is hosted on the cloud (e.g., n8n.cloud), create a secure outbound tunnel:
```bash
cloudflared tunnel --url http://localhost:5000
```
Copy the generated `https://*.trycloudflare.com` URL into n8n's **Send WAHA Text** HTTP request node.

### 4. Import the Workflow into n8n
1. Open your n8n workspace.
2. Click **Add Workflow > Import from File**.
3. Select `Razak Agents/odin_whatsapp_sales_agent.json`.
4. Configure your Google Generative AI / Gemini credentials.
5. Activate the workflow!

---

