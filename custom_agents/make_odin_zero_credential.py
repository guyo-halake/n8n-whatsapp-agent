import os
import urllib.request
import json

token = os.environ.get("N8N_MCP_TOKEN", "")
url = 'https://p3lautomate.app.n8n.cloud/mcp-server/http'
bot_token = '8742307708:AAFcN6PzTUOwCr_bzeAIRekcJjQuG1E5FMQ'

operations = [
    # Remove nodes requiring missing telegramApi credential
    {'type': 'removeNode', 'nodeName': 'Telegram Inbound Trigger'},
    {'type': 'removeNode', 'nodeName': 'Send Reply to Guyo'},

    # Add Webhook for Telegram Inbound
    {
        'type': 'addNode',
        'node': {
            'name': 'Telegram Webhook Trigger',
            'type': 'n8n-nodes-base.webhook',
            'typeVersion': 2,
            'position': [0, 112],
            'parameters': {
                'path': 'odin-chat',
                'httpMethod': 'POST',
                'responseMode': 'onReceived'
            }
        }
    },
    # Add Direct HTTP Reply Node
    {
        'type': 'addNode',
        'node': {
            'name': 'Send AI Reply via Telegram',
            'type': 'n8n-nodes-base.httpRequest',
            'typeVersion': 4.2,
            'position': [576, 112],
            'parameters': {
                'method': 'POST',
                'url': f'https://api.telegram.org/bot{bot_token}/sendMessage',
                'sendBody': True,
                'specifyBody': 'json',
                'jsonBody': '''={\n  "chat_id": 5784911905,\n  "text": $json.output,\n  "parse_mode": "Markdown"\n}'''
            }
        }
    },
    # Wire Webhook -> Agent -> HTTP Reply
    {
        'type': 'addConnection',
        'source': 'Telegram Webhook Trigger',
        'target': 'ODIN Master Copilot',
        'connectionType': 'main',
        'sourceIndex': 0,
        'targetIndex': 0
    },
    {
        'type': 'addConnection',
        'source': 'ODIN Master Copilot',
        'target': 'Send AI Reply via Telegram',
        'connectionType': 'main',
        'sourceIndex': 0,
        'targetIndex': 0
    }
]

req = urllib.request.Request(
    url,
    data=json.dumps({
        'jsonrpc': '2.0',
        'id': 97,
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
            print('Updated to Webhook:', line[6:400])
