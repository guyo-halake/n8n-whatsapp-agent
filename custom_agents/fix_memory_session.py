import os
import urllib.request
import json

token = os.environ.get("N8N_MCP_TOKEN", "")
url = 'https://p3lautomate.app.n8n.cloud/mcp-server/http'

system_instructions = '''You are ODIN, the personal AI Chief of Staff and Sentinel for Guyo Razak Halake (he goes by Razak).
Razak is a 23-year-old software engineer and founder of P3L Developers, based in Ruiru/Nairobi, Kenya (Africa/Nairobi, UTC+3).
He is pursuing a Bachelor of Applied Computing at KCA University (target: First Class Honours).

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
- Address him as Razak. Speak with high agency and confidence.'''

operations = [
    {
        'type': 'setNodeParameter',
        'nodeName': 'ODIN Master Copilot',
        'path': '/parameters/text',
        'value': '={{ $json.body.message.text }}'
    },
    {
        'type': 'setNodeParameter',
        'nodeName': 'ODIN Master Copilot',
        'path': '/parameters/options/systemMessage',
        'value': system_instructions
    },
    {
        'type': 'setNodeParameter',
        'nodeName': 'Odin Conversation Memory',
        'path': '/parameters/sessionIdType',
        'value': 'customKey'
    },
    {
        'type': 'setNodeParameter',
        'nodeName': 'Odin Conversation Memory',
        'path': '/parameters/sessionKey',
        'value': '={{ $json.body.message.chat.id || 5784911905 }}'
    }
]

req = urllib.request.Request(
    url,
    data=json.dumps({
        'jsonrpc': '2.0',
        'id': 115,
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
            print('Workflow patched:', line[6:400])

