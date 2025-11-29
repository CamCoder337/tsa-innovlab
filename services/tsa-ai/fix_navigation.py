#!/usr/bin/env python3
"""Fix navigation schema: replace 'route' with 'path' in chatbot service"""

import sys

def fix_navigation():
    filepath = 'app/services/chatbot_function_calling_service.py'
    
    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count occurrences before
    count_before = content.count('"route":')
    print(f"Found {count_before} occurrences of '\"route\":'")
    
    # Replace
    content = content.replace('"route":', '"path":')
    
    # Count after
    count_after = content.count('"path":')
    print(f"Now have {count_after} occurrences of '\"path\":'")
    
    # Write back
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"✅ Successfully replaced {count_before} occurrences")
    return 0

if __name__ == '__main__':
    sys.exit(fix_navigation())
