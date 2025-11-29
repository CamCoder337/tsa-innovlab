#!/usr/bin/env python3
"""Remove UUID cast from chatbot service - users.id is INTEGER, not UUID"""

def fix_uuid_cast():
    filepath = 'app/services/chatbot_function_calling_service.py'
    
    # Read file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # The problematic line that tries to cast integer to UUID
    old_line = 'WHERE id = CAST(:user_id AS UUID)'
    new_line = 'WHERE id = :user_id'
    
    if old_line in content:
        print(f"❌ Found problematic CAST: '{old_line}'")
        content = content.replace(old_line, new_line)
        print(f"✅ Replaced with: '{new_line}'")
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print("✅ Fix applied successfully!")
        return 0
    else:
        print(f"⚠️  CAST not found - already fixed or different format")
        # Check if it's already correct
        if new_line in content:
            print("✅ Query is already correct (no CAST)")
            return 0
        else:
            print("❌ Neither old nor new format found - manual check needed")
            return 1

if __name__ == '__main__':
    import sys
    sys.exit(fix_uuid_cast())
