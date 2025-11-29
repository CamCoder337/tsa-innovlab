import sys
import traceback

with open('syntax_error.txt', 'w') as f:
    try:
        compile(open('app/services/chatbot_function_calling_service.py').read(), 'chatbot_function_calling_service.py', 'exec')
        f.write("✅ File syntax is valid!\n")
    except SyntaxError as e:
        f.write(f"❌ SyntaxError at line {e.lineno}\n")
        f.write(f"Error: {e.msg}\n")
        f.write(f"Text: {e.text}\n")
        f.write(f"Offset: {e.offset}\n")
        f.write(traceback.format_exc())
