import os
import json

def verify(path):
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    node_names = {n['name'] for n in data['nodes']}
    errors = []
    for src, conns in data['connections'].items():
        if src not in node_names:
            errors.append(f"Source connection node not found: {src}")
        for conn_type, target_lists in conns.items():
            for target_list in target_lists:
                for target in target_list:
                    t_name = target['node']
                    if t_name not in node_names:
                        errors.append(f"Target node not found: {t_name} (from {src})")
    print(f"File {path}: Valid JSON! {len(data['nodes'])} nodes, {len(data['connections'])} connection sets.")
    if errors:
        print("Connection errors found:", errors)
    else:
        print("-> All connections 100% matched perfectly!")

verify('custom_agents/odin_personal_copilot_workflow.json')
verify('custom_agents/business_omnichannel_concierge_workflow.json')

