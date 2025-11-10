"""
Extracteur pour CNI camerounaise nouveau format
"""
import re
from typing import Dict
import easyocr
from .base import BaseExtractor


class CNINouveauExtractor(BaseExtractor):
    """Extracteur pour le nouveau format de CNI camerounaise"""

    def __init__(self):
        super().__init__()
        print("Initialisation de EasyOCR (français et anglais)...")
        self.reader = easyocr.Reader(['fr', 'en'], gpu=True)
        print("EasyOCR initialisé")

    @property
    def document_type(self) -> str:
        return "CNI Camerounaise (Nouveau Format)"

    @property
    def document_code(self) -> str:
        return "CNI_NOUVEAU"

    def extract_text_easyocr(self, image_path: str) -> str:
        """Extrait le texte avec EasyOCR"""
        img = self.preprocess_image(image_path)
        print(f"   Analyse OCR en cours...")
        results = self.reader.readtext(img, detail=0, paragraph=False)
        text = '\n'.join(results)
        print(f"   {len(results)} lignes de texte détectées")
        return text

    def is_valid_field(self, value: str, field_type: str) -> bool:
        """Valide un champ extrait pour éliminer le bruit"""
        if not value:
            return False

        value_upper = value.upper()
        noise_words = [
            'CAMSCANNER', 'SCANNE', 'AVEC', 'RÉPUBLIQUE', 'REPUBLIC',
            'CAMEROUN', 'CAMEROON', 'SIGNATURE', 'TRAVAIL', 'PATRIE',
            'UNIQUE', 'EXPIRATION', 'EXPIRY'
        ]

        for noise in noise_words:
            if noise in value_upper:
                return False

        if field_type == 'taille':
            try:
                taille_num = float(value.replace(',', '.').replace('m', '').strip())
                return 1.0 <= taille_num <= 2.5
            except:
                return False

        if field_type in ['nom', 'prenom']:
            if len(re.findall(r'[^A-Z\s\-]', value_upper)) > 2:
                return False
            if len(value.strip()) < 2:
                return False

        return True

    def extract_recto_info(self, text: str) -> Dict[str, str]:
        """Extrait les informations du recto (nouveau format)"""
        info = {}
        lines = text.split('\n')

        print("\nExtraction des informations du RECTO (nouveau format):")

        for i, line in enumerate(lines):
            line_clean = line.strip()
            line_upper = line_clean.upper()

            # Nom - un seul mot en MAJUSCULES
            if line_clean and line_clean.isupper() and len(line_clean.split()) == 1 and len(line_clean) >= 3:
                if self.is_valid_field(line_clean, 'nom') and 'nom' not in info:
                    if 'NOM' not in line_clean and 'SURNAME' not in line_clean and line_clean not in ['TRAVAIL', 'PATRIE']:
                        info['nom'] = line_clean
                        print(f"   Nom: {line_clean}")

            # Prénoms - format CamelCase ou MAJUSCULES après le nom
            if re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$', line_clean) or \
               (line_clean and line_clean.isupper() and len(line_clean.split()) >= 2 and 'nom' in info):
                if self.is_valid_field(line_clean, 'prenom') and 'prenoms' not in info:
                    if 'PRENOM' not in line_upper and 'GIVEN' not in line_upper:
                        info['prenoms'] = line_clean
                        print(f"   Prénoms: {line_clean}")

            # Date de naissance
            if re.match(r'\d{2}[,\.]\d{2}[,\.]\d{4}', line_clean):
                year_match = re.search(r'(\d{4})', line_clean)
                if year_match:
                    year = int(year_match.group(1))
                    if 1950 <= year <= 2015 and 'date_naissance' not in info:
                        info['date_naissance'] = line_clean
                        print(f"   Date de naissance: {line_clean}")
                    elif 2020 <= year <= 2050 and 'date_expiration' not in info:
                        info['date_expiration'] = line_clean
                        print(f"   Date d'expiration: {line_clean}")

            # Sexe
            if line_clean in ['M', 'F'] and 'sexe' not in info:
                info['sexe'] = line_clean
                print(f"   Sexe: {line_clean}")

        return info

    def extract_verso_info(self, text: str) -> Dict[str, str]:
        """Extrait les informations du verso (nouveau format)"""
        info = {}
        lines = text.split('\n')

        print("\nExtraction des informations du VERSO (nouveau format):")

        for i, line in enumerate(lines):
            line_clean = line.strip()
            line_upper = line_clean.upper()

            # Père
            if 'PÈRE' in line_upper or ('FATHER' in line_upper and 'NAME' in line_upper):
                for j in range(i + 1, min(i + 4, len(lines))):
                    pere_candidate = lines[j].strip()
                    if pere_candidate and self.is_valid_field(pere_candidate, 'nom') and len(pere_candidate.split()) >= 2:
                        info['pere'] = pere_candidate
                        print(f"   Père: {pere_candidate}")
                        break

            # Mère
            if 'MÈRE' in line_upper or ('MOTHER' in line_upper and 'NAME' in line_upper):
                for j in range(i + 1, min(i + 4, len(lines))):
                    mere_candidate = lines[j].strip()
                    if mere_candidate and self.is_valid_field(mere_candidate, 'nom') and len(mere_candidate.split()) >= 3:
                        info['mere'] = mere_candidate
                        print(f"   Mère: {mere_candidate}")
                        break

            # Lieu de naissance
            if ('LIEU' in line_upper and 'NAISSANCE' in line_upper) or ('PLACE' in line_upper and 'BIRTH' in line_upper):
                for j in range(i + 1, min(i + 4, len(lines))):
                    lieu_candidate = lines[j].strip()
                    if lieu_candidate and lieu_candidate.isupper() and 3 <= len(lieu_candidate) <= 15:
                        info['lieu_naissance'] = lieu_candidate
                        print(f"   Lieu de naissance: {lieu_candidate}")
                        break

            # Profession
            if 'PROFESSION' in line_upper or 'OCCUPATION' in line_upper:
                for j in range(i + 1, min(i + 4, len(lines))):
                    prof_candidate = lines[j].strip()
                    if prof_candidate and len(prof_candidate) >= 3 and 'DATE' not in prof_candidate.upper():
                        info['profession'] = prof_candidate.upper()
                        print(f"   Profession: {prof_candidate.upper()}")
                        break

            # Taille
            if re.match(r'^\d[,\.]\d{2}\s*m?$', line_clean.lower()):
                taille = line_clean.replace('m', '').strip()
                if self.is_valid_field(taille, 'taille'):
                    info['taille'] = taille
                    print(f"   Taille: {taille}")

            # Date de délivrance
            if 'DATE' in line_upper and i + 1 < len(lines):
                date_candidate = lines[i + 1].strip()
                if re.match(r'\d{2}\.\d{2}\.\d{4}', date_candidate):
                    year_match = re.search(r'(\d{4})', date_candidate)
                    if year_match and 2010 <= int(year_match.group(1)) <= 2030:
                        if 'date_delivrance' not in info:
                            info['date_delivrance'] = date_candidate
                            print(f"   Date de délivrance: {date_candidate}")

            # Numéro CNI - format AA12345678
            if re.match(r'^[A-Z]{2}\d{8}$', line_clean):
                info['numero'] = line_clean
                print(f"   Numéro CNI: {line_clean}")

            # Autorité
            if re.match(r'^[A-Z][a-z]+\s+[A-Z]+(?:\s+[A-Z]+)?', line_clean):
                if self.is_valid_field(line_clean, 'nom') and len(line_clean.split()) >= 2:
                    info['autorite'] = line_clean
                    print(f"   Autorité: {line_clean}")

        return info

    def extract_info(self, recto_path: str, verso_path: str = None) -> Dict:
        """Extrait toutes les informations"""
        print(f"\nTraitement du RECTO (nouveau format): {recto_path}")
        recto_text = self.extract_text_easyocr(recto_path)

        verso_info = {}
        verso_text = ""
        if verso_path:
            print(f"\nTraitement du VERSO (nouveau format): {verso_path}")
            verso_text = self.extract_text_easyocr(verso_path)
            verso_info = self.extract_verso_info(verso_text)

        recto_info = self.extract_recto_info(recto_text)

        return {
            'recto': recto_info,
            'verso': verso_info,
            'texte_brut_recto': recto_text,
            'texte_brut_verso': verso_text,
            'metadata': self.get_metadata()
        }
