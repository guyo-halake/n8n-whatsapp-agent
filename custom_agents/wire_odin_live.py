import os
import urllib.request
import json

token = os.environ.get("N8N_MCP_TOKEN", "")
n8n_url = 'https://p3lautomate.app.n8n.cloud/mcp-server/http'
bot_token = '8742307708:AAFcN6PzTUOwCr_bzeAIRekcJjQuG1E5FMQ'
chat_id = 5784911905

# 1. Update the Send Reply nodes in the workflow to use the real Telegram Bot directly
operations = [
    {
        'type': 'updateNodeParameters',
        'nodeName': 'Send Reply to Guyo',
        'parameters': {
            'method': 'POST',
            'url': f'https://api.telegram.org/bot{bot_token}/sendMessage',
            'sendBody': True,
            'bodyParameters': {
                'parameters': [
                    {'name': 'chat_id', 'value': str(chat_id)},
                    {'name': 'text', 'value': '={{ $json.output }}'},
                    {'name': 'parse_mode', 'value': 'Markdown'}
                ]
            }
        }
    },
    {
        'type': 'updateNodeParameters',
        'nodeName': 'Send Morning Briefing Telegram',
        'parameters': {
            'method': 'POST',
            'url': f'https://api.telegram.org/bot{bot_token}/sendMessage',
            'sendBody': True,
            'bodyParameters': {
                'parameters': [
                    {'name': 'chat_id', 'value': str(chat_id)},
                    {'name': 'text', 'value': '={{ $json.briefing }}'},
                    {'name': 'parse_mode', 'value': 'Markdown'}
                ]
            }
        }
    }
]

# We also change their node type to httpRequest if needed, or update parameters
print("Applying operations...")
payload = {
    'jsonrpc': '2.0',
    'id': 85,
    'method': 'tools/call',
    'params': {
        'name': 'update_workflow',
        'arguments': {
            'workflowId': 'UyeR4XPRpyEQPaPM',
            'operations': [
                {
                    'type': 'setNodeParameter',
                    'nodeName': 'Send Morning Briefing Telegram',
                    'path': '/parameters/chatId',
                    'value': str(chat_id)
                },
                {
                    'type': 'setNodeParameter',
                    'nodeName': 'Send Reply to Guyo',
                    'path': '/parameters/chatId',
                    'value': str(chat_id)
                }
            ]
        }
    }
}

req = urllib.request.Request(
    n8n_url,
    data=json.dumps(payload).encode('utf-8'),
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
            print('Workflow updated:', line[6:400])

