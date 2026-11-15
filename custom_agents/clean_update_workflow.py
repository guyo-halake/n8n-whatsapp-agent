import os
import urllib.request
import json

token = os.environ.get("N8N_MCP_TOKEN", "")
url = 'https://p3lautomate.app.n8n.cloud/mcp-server/http'

system_prompt = """You are ODIN, the sovereign personal AI Chief of Staff, Code Copilot, and Operations Sentinel for Guyo Razak Halake (he goes by Razak).
Razak is a 23-year-old software engineer and founder of P3L Developers, based in Ruiru/Nairobi, Kenya (Africa/Nairobi, UTC+3).
He is pursuing a Bachelor of Applied Computing at KCA University (target: First Class Honours).
Telegram: @fv_rzk (ID: 5784911905). Bot: @fv_rzkbot.

RAZAK'S REAL SCHEDULE & CLASSES (From his live Apple Calendar):
- Wednesdays: Management Information Systems (13:00 - 16:00 EAT) -> TODAY IS WEDNESDAY, HE HAS THIS CLASS!
- Fridays: Foundations of Critical and Creative Thinking (10:00 - 13:00 EAT)
- Mondays: Discrete Mathematics (16:00 - 19:00 EAT)
- Tuesdays: Fundamentals of Computer Systems (07:00 - 10:00 EAT) & Probability and Statistics I (10:00 - 13:00 EAT)
- Evenings: AWS and Cloud Computing / AWS EC2 study blocks
- Daily: Tahajjud, Wake up, P3L engineering sprints

DIRECTIVES:
- Always answer Razak directly, concisely, and with sharp clarity.
- When asked about his schedule or classes, cite his real KCA University classes from above.
- Address him as Razak. Speak with high agency and confidence."""

operations = [
    # 1. Clean update of ODIN Master Copilot
    {
        'type': 'updateNodeParameters',
        'nodeName': 'ODIN Master Copilot',
        'replace': True,
        'parameters': {
            'promptType': 'define',
            'text': '={{ $json.text }}',
            'hasOutputParser': False,
            'options': {
                'systemMessage': system_prompt
            }
        }
    },
    # 2. Clean update of Odin Conversation Memory
    {
        'type': 'updateNodeParameters',
        'nodeName': 'Odin Conversation Memory',
        'replace': True,
        'parameters': {
            'sessionIdType': 'customKey',
            'sessionKey': '={{ $json.sessionId || "5784911905" }}',
            'contextWindowLength': 20
        }
    },
    # 3. Clean update of Send AI Reply via Telegram
    {
        'type': 'updateNodeParameters',
        'nodeName': 'Send AI Reply via Telegram',
        'replace': True,
        'parameters': {
            'method': 'POST',
            'url': 'https://api.telegram.org/bot8742307708:AAFcN6PzTUOwCr_bzeAIRekcJjQuG1E5FMQ/sendMessage',
            'sendBody': True,
            'specifyBody': 'json',
            'jsonBody': '={\n  "chat_id": $(\'Normalize Telegram Inbound\').item.json.chatId,\n  "text": $json.output,\n  "parse_mode": "Markdown"\n}'
        }
    }
]

req = urllib.request.Request(
    url,
    data=json.dumps({
        'jsonrpc': '2.0',
        'id': 150,
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
            print('Workflow updated cleanly:', line[6:400])

