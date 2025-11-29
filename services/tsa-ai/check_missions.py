#!/usr/bin/env python3
"""
Diagnostic script for missions table
"""
import sys
import os
from sqlalchemy import text, inspect

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal

def check_missions():
    print("=" * 60)
    print("Checking MISSIONS table...")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # 1. Check if table exists
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        if 'missions' not in tables:
            print("❌ Table 'missions' DOES NOT EXIST!")
            return 1
        
        print("✅ Table 'missions' exists")
        
        # 2. Check columns
        columns = inspector.get_columns('missions')
        print("\nColumns:")
        for col in columns:
            print(f"  - {col['name']}: {col['type']}")
            
        # 3. Check specific columns for user relation
        affreteur_col = next((c for c in columns if c['name'] == 'affreteur_id'), None)
        transporter_col = next((c for c in columns if c['name'] == 'transporteur_id'), None)
        
        if affreteur_col:
            print(f"\n✅ affreteur_id found: {affreteur_col['type']}")
        else:
            print("\n❌ affreteur_id NOT FOUND")
            
        if transporter_col:
            print(f"✅ transporteur_id found: {transporter_col['type']}")
        else:
            print("❌ transporteur_id NOT FOUND")
            
        # 4. Try a dummy query with integer ID
        print("\nTesting query with integer ID '1'...")
        try:
            query = text("SELECT count(*) FROM missions WHERE affreteur_id = :uid")
            db.execute(query, {"uid": 1})
            print("✅ Query with integer ID successful")
        except Exception as e:
            print(f"❌ Query with integer ID failed: {e}")
            
    except Exception as e:
        print(f"\n❌ Global Error: {e}")
        return 1
    finally:
        db.close()
    
    print("=" * 60)
    return 0

if __name__ == '__main__':
    sys.exit(check_missions())
