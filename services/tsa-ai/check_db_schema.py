#!/usr/bin/env python3
"""
Script to check and log the actual data type of users.id column
This will help diagnose the UUID vs Integer issue
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from sqlalchemy import inspect, text

def check_users_id_type():
    """Check the actual type of users.id column"""
    print("=" * 60)
    print("Checking users.id column type...")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # Method 1: Using SQLAlchemy inspector
        inspector = inspect(db.bind)
        columns = inspector.get_columns('users')
        
        id_column = next((col for col in columns if col['name'] == 'id'), None)
        if id_column:
            print(f"\n✓ Column 'id' found via inspector:")
            print(f"  - Name: {id_column['name']}")
            print(f"  - Type: {id_column['type']}")
            print(f"  - Nullable: {id_column.get('nullable', 'unknown')}")
            print(f"  - Default: {id_column.get('default', 'none')}")
        
        # Method 2: Query information_schema
        query = text("""
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'id'
        """)
        result = db.execute(query).fetchone()
        
        if result:
            print(f"\n✓ Column 'id' found via information_schema:")
            print(f"  - Column: {result[0]}")
            print(f"  - Data Type: {result[1]}")
            print(f"  - UDT Name: {result[2]}")
            
            # Determine the fix needed
            print("\n" + "=" * 60)
            if result[2] == 'uuid':
                print("📌 CONCLUSION: Column is UUID type")
                print("   ❌ Current error: Cannot cast integer to UUID")
                print("   ✅ FIX: user_id must be passed as string UUID, not integer")
                print("   📝 Solution: Convert user_id to string before query")
            elif result[2] in ['int4', 'int8', 'integer', 'bigint']:
                print("📌 CONCLUSION: Column is INTEGER type")
                print("   ❌ Original error was misleading")
                print("   ✅ FIX: Remove CAST, use simple WHERE id = :user_id")
                print("   📝 Solution: No type casting needed")
            else:
                print(f"⚠️  UNKNOWN TYPE: {result[2]}")
                print("   Manual investigation required")
        else:
            print("\n❌ Column 'id' not found!")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1
    finally:
        db.close()
    
    print("=" * 60)
    return 0

if __name__ == '__main__':
    sys.exit(check_users_id_type())
