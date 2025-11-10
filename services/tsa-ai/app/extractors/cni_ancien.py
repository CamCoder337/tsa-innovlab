"""
Extracteur pour CNI camerounaise ancien format
"""
import re
from typing import Dict, List, Tuple, Optional
import easyocr
from .base import BaseExtractor


class CNIAncienExtractor(BaseExtractor):
    """Extracteur pour l'ancien format de CNI camerounaise"""

    def __init__(self):
        super().__init__()
        print("Initialisation de EasyOCR (français et anglais)...")
        self.reader = easyocr.Reader(['fr', 'en'], gpu=True)
        print("EasyOCR initialisé")

    @property
    def document_type(self) -> str:
        return "CNI Camerounaise (Ancien Format)"

    @property
    def document_code(self) -> str:
        return "CNI_ANCIEN"

    def extract_text_easyocr(self, image_path: str) -> str:
        """Extrait le texte avec EasyOCR"""
        img = self.preprocess_image(image_path)
        print(f"   Analyse OCR en cours...")
        results = self.reader.readtext(img, detail=0, paragraph=False)
        text = '\n'.join(results)
        print(f"   {len(results)} lignes de texte détectées")
        return text

    def clean_text(self, text: str) -> str:
        """Nettoie le texte extrait"""
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n+', '\n', text)
        return text.strip()

    def is_valid_field(self, value: str, field_type: str) -> bool:
        """Valide un champ extrait pour éliminer le bruit"""
        if not value:
            return False

        value_upper = value.upper()
        noise_words = [
            'CAMSCANNER', 'SCANNE', 'AVEC', 'RÉPUBLIQUE', 'REPUBLIC',
            'CAMEROUN', 'CAMEROON', 'SIGNATURE', 'IDENTIFIANT', 'UNIQUE',
            'EXPIRATION', 'DÉLIVRANCE', 'ISSUE', 'EXPIRY', 'ADDRESS',
            'ADRESSE', 'AUTORITÉ', 'AUTHORITY', 'DATE', 'POSTE'
        ]

        for noise in noise_words:
            if noise in value_upper:
                return False

        if field_type == 'taille':
            try:
                taille_num = float(value.replace(',', '.'))
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
        """Extrait les informations du recto"""
        info = {}
        lines = text.split('\n')

        print("\nExtraction des informations du RECTO (ancien format):")

        for i, line in enumerate(lines):
            line_clean = line.strip()
            line_upper = line_clean.upper()

            # Nom - après "Homisurname" ou ligne avec 2 mots en MAJUSCULES
            if 'HOMISURNAME' in line_upper or 'SURNAME' in line_upper:
                if i + 1 < len(lines):
                    nom_candidate = lines[i + 1].strip()
                    if nom_candidate and self.is_valid_field(nom_candidate, 'nom') and len(nom_candidate.split()) >= 2:
                        info['nom'] = nom_candidate
                        print(f"   Nom: {nom_candidate}")

            # Prénoms - après "rrlnoms" (skip 1 ligne avec chiffre)
            if 'RRLNOMS' in line_upper:
                if i + 2 < len(lines):
                    prenom_candidate = lines[i + 2].strip()
                    if prenom_candidate and self.is_valid_field(prenom_candidate, 'prenom'):
                        info['prenoms'] = prenom_candidate
                        print(f"   Prénoms: {prenom_candidate}")

            # Date de naissance - ligne avec format date
            if re.match(r'\d{2}[,\.]\d{2}\.\d{4}', line_clean):
                year_match = re.search(r'(\d{4})', line_clean)
                if year_match and 1950 <= int(year_match.group(1)) <= 2015:
                    info['date_naissance'] = line_clean
                    print(f"   Date de naissance: {line_clean}")

            # Lieu de naissance - après la date, chercher ville en MAJUSCULES
            if 'UVDRRESANCU' in line_upper or 'PLACE' in line_upper:
                # Chercher dans les 3 prochaines lignes
                for j in range(i + 1, min(i + 4, len(lines))):
                    lieu_candidate = lines[j].strip()
                    if lieu_candidate.isupper() and 3 <= len(lieu_candidate) <= 15 and self.is_valid_field(lieu_candidate, 'lieu'):
                        info['lieu_naissance'] = lieu_candidate
                        print(f"   Lieu de naissance: {lieu_candidate}")
                        break

            # Sexe - ligne avec juste M ou F
            if line_clean in ['M', 'F']:
                info['sexe'] = line_clean
                print(f"   Sexe: {line_clean}")

            # Taille - format X,XX
            if re.match(r'^\d[,\.]\d{2}$', line_clean):
                try:
                    taille_val = float(line_clean.replace(',', '.'))
                    if 1.0 <= taille_val <= 2.5:
                        info['taille'] = line_clean
                        print(f"   Taille: {line_clean}")
                except:
                    pass

            # Profession - après "Profession"
            if 'PROFESSION' in line_upper:
                if i + 1 < len(lines):
                    prof_candidate = lines[i + 1].strip()
                    if prof_candidate and self.is_valid_field(prof_candidate, 'profession') and len(prof_candidate) >= 3:
                        info['profession'] = prof_candidate.upper()
                        print(f"   Profession: {prof_candidate.upper()}")

        return info

    def extract_verso_info(self, text: str) -> Dict[str, str]:
        """Extrait les informations du verso"""
        info = {}
        lines = text.split('\n')

        print("\nExtraction des informations du VERSO (ancien format):")

        for i, line in enumerate(lines):
            line_clean = line.strip()
            line_upper = line_clean.upper()

            # Père - après "Pere'father"
            if 'PERE' in line_upper and 'FATHER' in line_upper:
                if i + 1 < len(lines):
                    pere_candidate = lines[i + 1].strip()
                    if pere_candidate and self.is_valid_field(pere_candidate, 'nom') and len(pere_candidate) >= 3:
                        info['pere'] = pere_candidate
                        print(f"   Père: {pere_candidate}")

            # Mère - après "eReMother" ou ligne avec 4 mots en MAJUSCULES
            if 'MOTHER' in line_upper or 'MERE' in line_upper:
                if i + 1 < len(lines):
                    mere_candidate = lines[i + 1].strip()
                    # Vérifier que c'est un nom complet (plusieurs mots)
                    if mere_candidate and self.is_valid_field(mere_candidate, 'nom') and len(mere_candidate.split()) >= 3:
                        info['mere'] = mere_candidate
                        print(f"   Mère: {mere_candidate}")

            # Adresse - chercher "DLA-" ou format d'adresse
            if re.match(r'^[A-Z]{3,}-[A-Z]+$', line_clean):
                # Format comme DLA-BONAMOUSSAD
                info['adresse'] = line_clean
                print(f"   Adresse: {line_clean}")

            # Date de délivrance - date proche de "DÉLIVRANCE" ou "ISSUE"
            if 'DÉLIVRANCE' in line_upper or (line_upper == 'DATE OF ISSUE'):
                # Chercher date dans les 3 prochaines lignes
                for j in range(i + 1, min(i + 4, len(lines))):
                    date_candidate = lines[j].strip()
                    if re.match(r'\d{2}\.\d{2}\.\d{4}', date_candidate):
                        year_match = re.search(r'(\d{4})', date_candidate)
                        if year_match and 2010 <= int(year_match.group(1)) <= 2025:
                            info['date_delivrance'] = date_candidate
                            print(f"   Date de délivrance: {date_candidate}")
                            break

            # Date d'expiration - date proche de "EXPIRATION" ou "EXPIRY"
            if 'EXPIRATION' in line_upper or 'EXPIRY' in line_upper:
                # Chercher date dans les 3 prochaines lignes
                for j in range(i + 1, min(i + 4, len(lines))):
                    date_candidate = lines[j].strip()
                    if re.match(r'\d{2}\.\d{2}[,\.]\d{4}', date_candidate):
                        year_match = re.search(r'(\d{4})', date_candidate)
                        if year_match and 2020 <= int(year_match.group(1)) <= 2050:
                            info['date_expiration'] = date_candidate
                            print(f"   Date d'expiration: {date_candidate}")
                            break

            # Poste d'identification - format LT13
            if re.match(r'^[A-Z]{2,3}\d{1,3}$', line_clean):
                info['poste_identification'] = line_clean
                print(f"   Poste d'identification: {line_clean}")

            # Autorité - format "Prénom NOM-NOM"
            if re.match(r'^[A-Z][a-z]+\s+[A-Z]+[- ][A-Z]+', line_clean):
                if self.is_valid_field(line_clean, 'nom'):
                    info['autorite'] = line_clean
                    print(f"   Autorité: {line_clean}")

            # Identifiant unique (16-17 chiffres avec /) - DOIT être traité AVANT le numéro CNI
            if '/' in line_clean:
                line_no_slash = line_clean.replace('/', '')
                if re.match(r'^\d{16,17}$', line_no_slash):
                    # Correction: si 16 chiffres et format AAAAMMMMMMMM/0XXX, probablement mal OCRisé
                    if len(line_no_slash) == 16:
                        # Pattern: 12 chiffres + "/" + 4 chiffres commençant par 0
                        match = re.match(r'^(\d{12})0(\d{3})$', line_no_slash)
                        if match:
                            # Ajouter le "1" manquant: XXXXXXXXXXXX + 1 + 0XXX
                            line_no_slash = match.group(1) + '1' + '0' + match.group(2)
                            print(f"   Identifiant unique: {line_no_slash} (corrigé de 16 à 17 chiffres)")
                        else:
                            print(f"   Identifiant unique: {line_no_slash}")
                    else:
                        print(f"   Identifiant unique: {line_no_slash}")
                    info['identifiant_unique'] = line_no_slash
                    continue  # Skip pour ne pas traiter cette ligne comme numéro CNI

            # Numéro CNI (9 chiffres) - seulement si ce n'est pas déjà trouvé
            if re.match(r'^\d{9}$', line_clean):
                if 'numero' not in info:  # Prendre seulement le premier
                    info['numero'] = line_clean
                    print(f"   Numéro CNI: {line_clean}")

        return info

    def extract_info(self, recto_path: str, verso_path: str = None) -> Dict:
        """Extrait toutes les informations"""
        print(f"\nTraitement du RECTO (ancien format): {recto_path}")
        recto_text = self.extract_text_easyocr(recto_path)

        verso_info = {}
        verso_text = ""
        if verso_path:
            print(f"\nTraitement du VERSO (ancien format): {verso_path}")
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
