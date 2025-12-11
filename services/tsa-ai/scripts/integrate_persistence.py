"""
Script pour intégrer la persistance PostgreSQL dans le chatbot
Remplace les appels mémoire par des appels DB
"""
import re

def integrate_persistence():
    """Intégrer la persistance dans chatbot_function_calling_service.py"""
    
    file_path = "app/services/chatbot_function_calling_service.py"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Modification 1: Remplacer le chargement de l'historique
    # Chercher: if conv_id in self.conversation_memory:
    pattern1 = r'if conv_id in self\.conversation_memory:\s+history = self\.conversation_memory\[conv_id\]\s+messages\.extend\(history\[-self\.max_history_length:\]\)'
    replacement1 = '''# Load history from DB instead of memory
        history = await self._load_from_db(user_id, self.max_history_length)
        messages.extend(history)'''
    
    content = re.sub(pattern1, replacement1, content, flags=re.MULTILINE)
    
    # Modification 2: Remplacer la sauvegarde de l'historique
    # Chercher: self._save_to_memory(
    pattern2 = r'self\._save_to_memory\(conv_id, message, final_message\)'
    replacement2 = '''# Save to DB instead of memory
        await self._save_to_db(user_id, "user", message)
        await self._save_to_db(user_id, "assistant", final_message)'''
    
    content = re.sub(pattern2, replacement2, content)
    
    # Modification 3: Remplacer le rate limiting
    # Chercher: is_allowed, remaining = self._check_rate_limit(user_id)
    pattern3 = r'is_allowed, remaining = self\._check_rate_limit\(user_id\)'
    replacement3 = 'is_allowed, remaining = await self._check_rate_limit_db(user_id)'
    
    content = re.sub(pattern3, replacement3, content)
    
    # Sauvegarder
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("✅ Intégration de la persistance terminée")
    print("📝 Modifications effectuées:")
    print("  1. Chargement historique: mémoire → DB")
    print("  2. Sauvegarde historique: mémoire → DB")
    print("  3. Rate limiting: mémoire → DB")

if __name__ == "__main__":
    integrate_persistence()
