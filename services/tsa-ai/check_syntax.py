import sys

def check_quotes(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    in_triple_double = False
    in_triple_single = False
    
    start_line_double = -1
    start_line_single = -1

    with open('syntax_log.txt', 'w') as log:
        for i, line in enumerate(lines):
            # Simple parser - might be fooled by comments or strings inside strings, 
            # but good enough for finding the big unclosed block
            
            # Count occurrences
            triple_double = line.count('"""')
            triple_single = line.count("'''")
            
            # This is a naive check, but might help locate the issue
            if triple_double % 2 != 0:
                if not in_triple_double:
                    in_triple_double = True
                    start_line_double = i + 1
                    log.write(f"Line {i+1}: Opened triple double quotes\n")
                else:
                    in_triple_double = False
                    log.write(f"Line {i+1}: Closed triple double quotes (started at {start_line_double})\n")
            
            if triple_single % 2 != 0:
                 if not in_triple_single:
                    in_triple_single = True
                    start_line_single = i + 1
                    log.write(f"Line {i+1}: Opened triple single quotes\n")
                 else:
                    in_triple_single = False
                    log.write(f"Line {i+1}: Closed triple single quotes (started at {start_line_single})\n")

        if in_triple_double:
            log.write(f"ERROR: Unclosed triple double quotes starting at line {start_line_double}\n")
        
        if in_triple_single:
            log.write(f"ERROR: Unclosed triple single quotes starting at line {start_line_single}\n")

if __name__ == "__main__":
    check_quotes('app/services/chatbot_function_calling_service.py')
