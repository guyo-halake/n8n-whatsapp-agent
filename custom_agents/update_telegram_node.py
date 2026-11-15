import os
import urllib.request
import json

token = os.environ.get("N8N_MCP_TOKEN", "")
url = 'https://p3lautomate.app.n8n.cloud/mcp-server/http'
bot_token = '8742307708:AAFcN6PzTUOwCr_bzeAIRekcJjQuG1E5FMQ'
chat_id = '5784911905'

operations = [
    {
        'type': 'removeNode',
        'nodeName': 'Send Morning Briefing Telegram'
    },
    {
        'type': 'addNode',
        'node': {
            'name': 'Send Telegram Briefing (HTTP)',
            'type': 'n8n-nodes-base.httpRequest',
            'typeVersion': 4.2,
            'position': [880, 600],
            'parameters': {
                'method': 'POST',
                'url': f'https://api.telegram.org/bot{bot_token}/sendMessage',
                'sendBody': True,
                'specifyBody': 'json',
                'jsonBody': '={\n  "chat_id": "5784911905",\n  "text": $json.briefing,\n  "parse_mode": "Markdown"\n}'
            }
        }
    },
    {
        'type': 'addConnection',
        'source': 'Consolidate Standup Intel',
        'target': 'Send Telegram Briefing (HTTP)',
        'connectionType': 'main',
        'sourceIndex': 0,
        'targetIndex': 0
    }
]

req = urllib.request.Request(
    url,
    data=json.dumps({
        'jsonrpc': '2.0',
        'id': 96,
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
            print('Result:', line[6:400])

