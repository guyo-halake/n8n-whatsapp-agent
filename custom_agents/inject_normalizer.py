import os
import urllib.request
import json

token = os.environ.get("N8N_MCP_TOKEN", "")
url = 'https://p3lautomate.app.n8n.cloud/mcp-server/http'
bot_token = '8742307708:AAFcN6PzTUOwCr_bzeAIRekcJjQuG1E5FMQ'

operations = [
    # 1. Add Code node to extract and map sessionId, text, chatId cleanly
    {
        'type': 'addNode',
        'node': {
            'name': 'Normalize Telegram Inbound',
            'type': 'n8n-nodes-base.code',
            'typeVersion': 2,
            'position': [120, 112],
            'parameters': {
                'mode': 'runOnceForEachItem',
                'jsCode': '''const body = $input.item.json.body || {};
const msg = body.message || {};
const chatId = (msg.chat && msg.chat.id) ? String(msg.chat.id) : "5784911905";
const text = msg.text || "Hello Odin";
const senderName = [msg.from && msg.from.first_name, msg.from && msg.from.last_name].filter(Boolean).join(" ") || "Razak";

return {
  json: {
    sessionId: chatId,
    chatId: chatId,
    text: text,
    senderName: senderName
  }
};'''
            }
        }
    },
    # 2. Update ODIN agent text parameter to read directly from input
    {
        'type': 'setNodeParameter',
        'nodeName': 'ODIN Master Copilot',
        'path': '/parameters/text',
        'value': '={{ $json.text }}'
    },
    # 3. Update Send AI Reply to read chatId and output cleanly
    {
        'type': 'setNodeParameter',
        'nodeName': 'Send AI Reply via Telegram',
        'path': '/parameters/jsonBody',
        'value': '''={\n  "chat_id": $('Normalize Telegram Inbound').item.json.chatId,\n  "text": $json.output,\n  "parse_mode": "Markdown"\n}'''
    },
    # 4. Rewire: Webhook -> Normalize -> Agent
    {
        'type': 'removeConnection',
        'source': 'Telegram Webhook Trigger',
        'target': 'ODIN Master Copilot',
        'connectionType': 'main'
    },
    {
        'type': 'addConnection',
        'source': 'Telegram Webhook Trigger',
        'target': 'Normalize Telegram Inbound',
        'connectionType': 'main',
        'sourceIndex': 0,
        'targetIndex': 0
    },
    {
        'type': 'addConnection',
        'source': 'Normalize Telegram Inbound',
        'target': 'ODIN Master Copilot',
        'connectionType': 'main',
        'sourceIndex': 0,
        'targetIndex': 0
    }
]

req = urllib.request.Request(
    url,
    data=json.dumps({
        'jsonrpc': '2.0',
        'id': 120,
        'method': 'tools/call',
        'params': {
            'name': 'update_workflow',
            'arguments': {
                'workflowId': 'UyeR4XPRpyEQPaPM',
                'operations': operations
            }
        }
    }).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': f'Bearer {token}'
    }
)
with urllib.request.urlopen(req, timeout=15) as resp:
    raw = resp.read().decode('utf-8')
    for line in raw.split('\n'):
        if line.startswith('data: '):
            print('Workflow normalized:', line[6:400])

