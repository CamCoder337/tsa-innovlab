import ast

filepath = 'app/services/chatbot_function_calling_service.py'

with open(filepath, 'r', encoding='utf-8') as f:
    code = f.read()

with open('parse_result.txt', 'w', encoding='utf-8') as out:
    try:
        ast.parse(code, filename=filepath)
        out.write("SUCCESS: File parses correctly!\n")
    except SyntaxError as e:
        out.write(f"SYNTAX ERROR:\n")
        out.write(f"  Line: {e.lineno}\n")
        out.write(f"  Offset: {e.offset}\n")
        out.write(f"  Message: {e.msg}\n")
        out.write(f"  Text: {repr(e.text)}\n")
        out.write(f"\nFull error:\n")
        import traceback
        out.write(traceback.format_exc())

print("Check parse_result.txt for details")
