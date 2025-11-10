"""
Extracteur avancé pour CNI camerounaise ancien format

Adapté du code KYC/ocr test/ pour le service hybride
"""
import re
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)


class CNIAncienExtractor:
    """Extracteur spécialisé pour CNI ancien format avec parsing avancé"""
    
    def extract_from_text(self, text_recto: str, text_verso: str) -> Dict:
        """
        Extrait les informations structurées depuis le texte brut
        
        Args:
            text_recto: Texte brut du recto
            text_verso: Texte brut du verso
            
        Returns:
            Dictionnaire avec les champs extraits
        """
        data = {}
        
        # Extraire recto
        recto_data = self._parse_recto(text_recto)
        data.update(recto_data)
        
        # Extraire verso
        verso_data = self._parse_verso(text_verso)
        data.update(verso_data)
        
        return data
    
    def _parse_recto(self, text: str) -> Dict:
        """Parse le recto avec stratégie basée sur la position"""
        data = {}
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        
        logger.debug(f"Parsing recto: {len(lines)} lignes")
        
        nom_index = -1
        
        for i, line in enumerate(lines):
            line_upper = line.upper()
            
            # 1. Trouver le NOM (ligne en MAJUSCULES, 2+ mots, pas de mots-clés)
            if not data.get('nom'):
                if line.isupper() and len(line.split()) >= 2:
                    if self._is_valid_name(line) and not any(kw in line_upper for kw in ['REPUBLIQUE', 'CAMEROUN', 'REPUBLIC', 'CARTE', 'IDENTITE']):
                        data['nom'] = line
                        nom_index = i
                        logger.debug(f"Nom trouvé à ligne {i}: {line}")
            
            # 2. Prénoms = 2-3 lignes après le nom (ignorer ligne de bruit)
            if nom_index >= 0 and not data.get('prenoms'):
                # Chercher entre nom+2 et nom+4
                if nom_index + 2 <= i <= nom_index + 4:
                    # Ligne avec majuscules/minuscules mélangées
                    if any(c.isupper() for c in line) and any(c.islower() for c in line):
                        # Vérifier ratio voyelles (prénom réel)
                        vowels = sum(1 for c in line.lower() if c in 'aeiouy')
                        if vowels >= len(line) * 0.25:
                            if not any(kw in line_upper for kw in ['CAMEROUN', 'SCANNER', 'BIRTH', 'PLACE']):
                                data['prenoms'] = line
                                logger.debug(f"Prénoms trouvés à ligne {i}: {line}")
            
            # 3. Date de naissance - 8 chiffres consécutifs
            if not data.get('date_naissance'):
                # Chercher 8 chiffres (DDMMYYYY)
                match = re.search(r'(\d{2})[.,/]?(\d{2})[.,/]?(\d{4})', line)
                if match:
                    day, month, year = match.group(1), match.group(2), match.group(3)
                    try:
                        d, m, y = int(day), int(month), int(year)
                        if 1 <= d <= 31 and 1 <= m <= 12 and 1920 <= y <= 2015:
                            data['date_naissance'] = f"{day}.{month}.{year}"
                            logger.debug(f"Date naissance trouvée: {data['date_naissance']}")
                    except:
                        pass
            
            # 4. Lieu de naissance - villes camerounaises
            if not data.get('lieu_naissance'):
                villes = ['DOUALA', 'YAOUNDE', 'BAFOUSSAM', 'BAMENDA', 'GAROUA', 'MAROUA', 'NGAOUNDERE', 'BERTOUA', 'EBOLOWA', 'KRIBI', 'LIMBE', 'BUEA']
                if line_upper in villes:
                    data['lieu_naissance'] = line_upper
                    logger.debug(f"Lieu naissance trouvé: {line_upper}")
            
            # 5. Sexe - ligne avec juste M ou F
            if not data.get('sexe'):
                if line in ['M', 'F']:
                    data['sexe'] = line
                    logger.debug(f"Sexe trouvé: {line}")
            
            # 6. Taille - nombre entre 1.00 et 2.50
            if not data.get('taille'):
                match = re.search(r'\b(\d[,\.]\d{1,2})\b', line)
                if match:
                    try:
                        val = float(match.group(1).replace(',', '.'))
                        if 1.0 <= val <= 2.5:
                            data['taille'] = f"{val:.2f} m".replace('.', ',')
                            logger.debug(f"Taille trouvée: {data['taille']}")
                    except:
                        pass
            
            # 7. Profession - mot en MAJUSCULES après "PROFESSION"
            if not data.get('profession'):
                if 'PROFESSION' in line_upper or 'OCCUPATION' in line_upper:
                    # Chercher dans les 2 lignes suivantes
                    for j in range(i, min(i + 3, len(lines))):
                        prof = lines[j].strip()
                        if prof.isupper() and 3 <= len(prof) <= 30:
                            if prof not in ['PROFESSION', 'OCCUPATION', 'SIGNATURE']:
                                data['profession'] = prof
                                logger.debug(f"Profession trouvée: {prof}")
                                break
        
        return data
    
    def _parse_verso(self, text: str) -> Dict:
        """Parse le verso avec regex avancées"""
        data = {}
        lines = text.split('\n')
        
        logger.debug(f"Parsing verso: {len(lines)} lignes")
        
        for i, line in enumerate(lines):
            line_clean = line.strip()
            line_upper = line_clean.upper()
            
            # Père
            if not data.get('pere'):
                if 'PERE' in line_upper or 'FATHER' in line_upper:
                    if ':' in line:
                        pere = line.split(':', 1)[1].strip()
                        if self._is_valid_name(pere):
                            data['pere'] = pere
                    elif i + 1 < len(lines):
                        pere = lines[i + 1].strip()
                        if self._is_valid_name(pere):
                            data['pere'] = pere
            
            # Mère
            if not data.get('mere'):
                if ('MERE' in line_upper or 'MOTHER' in line_upper) and 'PERE' not in line_upper:
                    if ':' in line:
                        mere = line.split(':', 1)[1].strip()
                        if self._is_valid_name(mere):
                            data['mere'] = mere
                    elif i + 1 < len(lines):
                        mere = lines[i + 1].strip()
                        if self._is_valid_name(mere):
                            data['mere'] = mere
            
            # Numéro CNI (9-10 chiffres)
            if not data.get('numero'):
                numero_match = re.search(r'\b(\d{9,10})\b', line_clean)
                if numero_match:
                    data['numero'] = numero_match.group(1)
            
            # Date de délivrance
            if not data.get('date_delivrance'):
                if 'DELIVRANCE' in line_upper or 'ISSUE' in line_upper:
                    for j in range(i, min(i + 4, len(lines))):
                        date_match = re.search(r'\b(\d{1,2}[./]\d{1,2}[./]\d{4})\b', lines[j])
                        if date_match:
                            try:
                                year = int(re.search(r'\d{4}', date_match.group(1)).group())
                                if 2000 <= year <= 2030:
                                    data['date_delivrance'] = date_match.group(1)
                                    break
                            except:
                                pass
            
            # Date d'expiration
            if not data.get('date_expiration'):
                if 'EXPIRATION' in line_upper or 'EXPIRY' in line_upper:
                    for j in range(i, min(i + 4, len(lines))):
                        # Accepter point, virgule ou slash comme séparateur
                        date_match = re.search(r'\b(\d{1,2}[.,/]\d{1,2}[.,/]\d{4})\b', lines[j])
                        if date_match:
                            try:
                                date_str = date_match.group(1)
                                # Normaliser les séparateurs
                                date_normalized = date_str.replace(',', '.')
                                year = int(re.search(r'\d{4}', date_normalized).group())
                                if 2015 <= year <= 2050:
                                    data['date_expiration'] = date_normalized
                                    break
                            except:
                                pass
        
        return data
    
    def _is_valid_name(self, name: str) -> bool:
        """Valide qu'une chaîne ressemble à un nom"""
        if not name or len(name) < 3:
            return False
        
        # Mots de bruit à exclure
        noise_words = [
            'CAMSCANNER', 'SCANNE', 'AVEC', 'RÉPUBLIQUE', 'REPUBLIC',
            'CAMEROUN', 'CAMEROON', 'SIGNATURE', 'CARTE', 'IDENTITE',
            'NATIONALE', 'NATIONAL', 'IDENTITY', 'CARD'
        ]
        
        name_upper = name.upper()
        for noise in noise_words:
            if noise in name_upper:
                return False
        
        # Doit contenir principalement des lettres
        alpha_count = sum(c.isalpha() or c.isspace() or c == '-' for c in name)
        if alpha_count / len(name) < 0.7:
            return False
        
        return True
