import os
import urllib.request
import json

token = os.environ.get("N8N_MCP_TOKEN", "")
url = 'https://p3lautomate.app.n8n.cloud/mcp-server/http'

with open('custom_agents/odin_personal_copilot_workflow.json', 'r', encoding='utf-8') as f:
    wf_data = json.load(f)

operations = []

# 1. Update workflow metadata
operations.append({
    'type': 'setWorkflowMetadata',
    'name': 'ODIN - Personal AI Chief of Staff & Sentinel',
    'description': 'Academic LMS (KCAU), Apple Calendar, GitHub issues, Azure & n8n monitoring, and B2B lead hunting for Guyo'
})

# 2. Add nodes
for n in wf_data['nodes']:
    if n['type'] == 'n8n-nodes-base.stickyNote':
        continue
    
    node_type = n['type']
    type_version = n.get('typeVersion', 1)
    params = n.get('parameters', {})
    creds = {}
    
    # Map HTTP tool
    if 'toolHttpRequest' in node_type or 'httpRequestTool' in node_type:
        node_type = 'n8n-nodes-base.httpRequestTool'
        type_version = 1
    
    # Map Language Model to Google Gemini with Guyo's credential
    if 'Brain' in n['name'] or 'OpenAi' in node_type:
        node_type = '@n8n/n8n-nodes-langchain.lmChatGoogleGemini'
        type_version = 1
        params = {
            'modelName': 'models/gemini-2.0-flash'
        }
        creds = {
            'googlePalmApi': {
                'id': '31jTUxTlQfLgQhqA',
                'name': 'Google Gemini(PaLM) Api account'
            }
        }
    
    node_def = {
        'name': n['name'],
        'type': node_type,
        'typeVersion': type_version,
        'parameters': params,
        'position': n.get('position', [0, 0])
    }
    if creds:
        node_def['credentials'] = creds

    operations.append({
        'type': 'addNode',
        'node': node_def
    })

# 3. Add connections
for src, conn_types in wf_data['connections'].items():
    for c_type, target_lists in conn_types.items():
        for s_idx, target_list in enumerate(target_lists):
            for target in target_list:
                t_name = target['node']
                t_idx = target.get('index', 0)
                operations.append({
                    'type': 'addConnection',
                    'source': src,
                    'target': t_name,
                    'connectionType': c_type,
                    'sourceIndex': s_idx,
                    'targetIndex': t_idx
                })

print(f"Total operations: {len(operations)}")

# Send batch
payload = {
    'jsonrpc': '2.0',
    'id': 105,
    'method': 'tools/call',
    'params': {
        'name': 'update_workflow',
        'arguments': {
            'workflowId': 'JLYyfo4UZp12p3cL',
            'operations': operations
        }
    }
}

req = urllib.request.Request(
    url,
    data=json.dumps(payload).encode('utf-8'),
    headers={
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': f'Bearer {token}'
    }
)
with urllib.request.urlopen(req, timeout=30) as resp:
    raw = resp.read().decode('utf-8')
    for line in raw.split('\n'):
        if line.startswith('data: '):
            print("Response:", line[6:])
