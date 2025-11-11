import re
from typing import Dict, Optional
import easyocr
from .base import BaseExtractor


class PermisConduireExtractor(BaseExtractor):
    """Extracteur pour le Permis de Conduire Camerounais"""

    def __init__(self):
        super().__init__()
        print("Initialisation de EasyOCR pour le permis de conduire (français et anglais)...")
        self.reader = easyocr.Reader(['fr', 'en'], gpu=True)
        print("EasyOCR initialisé pour le permis de conduire")

    @property
    def document_type(self) -> str:
        return "Permis de Conduire Camerounais"

    @property
    def document_code(self) -> str:
        return "PERMIS_CONDUIRE"

    def extract_info(self, recto_path: str, verso_path: str = None) -> Dict:
        """
        Extrait les informations du permis de conduire

        Structure des champs du permis de conduire:
        RECTO:
            1. Nom (NOM/SURNAME)
            2. Prénom(s) (PRENOMS/GIVEN NAMES)
            3. Date et lieu de naissance (DATE DE NAISSANCE/DATE OF BIRTH et LIEU DE NAISSANCE/PLACE OF BIRTH)
            + Sexe (SEXE/SEX)
            + Taille (TAILLE/HEIGHT)

        VERSO:
            4a. Date de délivrance (DATE DE DÉLIVRANCE/DATE OF ISSUE)
            4b. Date d'expiration (DATE D'EXPIRATION/DATE OF EXPIRY)
            + Père (PERE/FATHER)
            + Mère (MERE/MOTHER)
            + Adresse (ADRESSE/ADDRESS)
            + Autorité (AUTORITÉ/AUTHORITY)
            + Identifiant unique (IDENTIFIANT UNIQUE/UNIQUE IDENTIFIER)
            + Numéro (Numéro du permis)
        """
        result = {
            "type_document": self.document_type,
            "code_document": self.document_code,
            "recto": {},
            "verso": {},
            "texte_brut_recto": "",
            "texte_brut_verso": ""
        }

        # Extraction du RECTO
        if recto_path:
            img_recto = self.preprocess_image(recto_path)
            results_recto = self.reader.readtext(img_recto, detail=0, paragraph=False)
            text_recto = '\n'.join(results_recto)
            result["texte_brut_recto"] = text_recto
            result["recto"] = self._extract_recto(results_recto)

        # Extraction du VERSO
        if verso_path:
            img_verso = self.preprocess_image(verso_path)
            results_verso = self.reader.readtext(img_verso, detail=0, paragraph=False)
            text_verso = '\n'.join(results_verso)
            result["texte_brut_verso"] = text_verso
            result["verso"] = self._extract_verso(results_verso)

        return result

    def _extract_recto(self, lines: list) -> Dict:
        """Extrait les informations du recto du permis"""
        info = {}

        for i, line in enumerate(lines):
            line_upper = line.upper().strip()

            # Champ 1: NOM (après NOM/SURNAME)
            if not info.get('nom') and any(keyword in line_upper for keyword in ['HOMISURNAME', 'NOM/SURNAME', 'SURNAME']):
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if self._is_valid_nom(next_line):
                        info['nom'] = next_line

            # Champ 2: PRENOMS (après PRENOMS/GIVEN NAMES)
            if not info.get('prenoms') and any(keyword in line_upper for keyword in ['PRENOMS', 'GIVEN NAMES', 'RRLNOMS']):
                # Chercher dans les 2 prochaines lignes
                for j in range(i + 1, min(i + 3, len(lines))):
                    candidate = lines[j].strip()
                    if self._is_valid_prenoms(candidate):
                        info['prenoms'] = candidate
                        break

            # Champ 3: DATE DE NAISSANCE (format DD.MM.YYYY)
            if not info.get('date_naissance'):
                date_match = re.search(r'\b(\d{2})[,\.](\d{2})[,\.](\d{4})\b', line)
                if date_match:
                    day, month, year = date_match.groups()
                    date_str = f"{day}.{month}.{year}"
                    # Valider l'année (personnes nées entre 1950 et 2010 environ)
                    if 1950 <= int(year) <= 2010:
                        info['date_naissance'] = date_str

            # Champ 3: LIEU DE NAISSANCE (après LIEU DE NAISSANCE/PLACE OF BIRTH)
            if not info.get('lieu_naissance') and any(keyword in line_upper for keyword in ['LIEU', 'PLACE', 'VeBE:ESSANCEPI']):
                for j in range(i + 1, min(i + 3, len(lines))):
                    candidate = lines[j].strip().upper()
                    if self._is_valid_lieu(candidate):
                        info['lieu_naissance'] = candidate
                        break

            # SEXE (M ou F)
            if not info.get('sexe'):
                # Chercher une ligne qui contient uniquement M ou F
                if re.match(r'^[MF]$', line.strip()):
                    info['sexe'] = line.strip()

            # TAILLE (format X,XX)
            if not info.get('taille'):
                taille_match = re.search(r'\b(\d)[,\.](\d{2})\b', line)
                if taille_match:
                    taille_str = f"{taille_match.group(1)},{taille_match.group(2)}"
                    taille_float = float(taille_str.replace(',', '.'))
                    if 1.0 <= taille_float <= 2.5:
                        info['taille'] = taille_str

        return info

    def _extract_verso(self, lines: list) -> Dict:
        """Extrait les informations du verso du permis"""
        info = {}

        for i, line in enumerate(lines):
            line_upper = line.upper().strip()

            # PERE (après PERE/FATHER)
            if not info.get('pere') and ('PERE' in line_upper or 'FATHER' in line_upper):
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if self._is_valid_nom_parent(next_line):
                        info['pere'] = next_line

            # MERE (après MERE/MOTHER)
            if not info.get('mere') and ('MERE' in line_upper or 'MOTHER' in line_upper):
                if i + 1 < len(lines):
                    next_line = lines[i + 1].strip()
                    if self._is_valid_nom_parent(next_line, min_words=3):
                        info['mere'] = next_line

            # ADRESSE (après ADRESSE/ADDRESS)
            if not info.get('adresse') and ('ADRESSE' in line_upper or 'ADDRESS' in line_upper):
                # Chercher dans les prochaines lignes
                for j in range(i + 1, min(i + 3, len(lines))):
                    candidate = lines[j].strip().upper()
                    if self._is_valid_adresse(candidate):
                        info['adresse'] = candidate
                        break

            # Champ 4a: DATE DE DELIVRANCE (DATE DE DÉLIVRANCE/DATE OF ISSUE)
            if not info.get('date_delivrance'):
                # Chercher si la ligne contient "DELIVRANCE" ou "ISSUE"
                if 'DELIVRANCE' in line_upper or 'ISSUE' in line_upper:
                    # Chercher une date dans cette ligne ou les suivantes
                    for j in range(i, min(i + 3, len(lines))):
                        date_match = re.search(r'\b(\d{2})[,\.](\d{2})[,\.](\d{4})\b', lines[j])
                        if date_match:
                            day, month, year = date_match.groups()
                            date_str = f"{day}.{month}.{year}"
                            # Valider l'année (délivrance entre 2000 et 2025)
                            if 2000 <= int(year) <= 2025:
                                info['date_delivrance'] = date_str
                                break

            # Champ 4b: DATE D'EXPIRATION (DATE D'EXPIRATION/DATE OF EXPIRY)
            if not info.get('date_expiration'):
                # Chercher si la ligne contient "EXPIRATION" ou "EXPIRY"
                if 'EXPIRATION' in line_upper or 'EXPIRY' in line_upper:
                    # Chercher une date dans cette ligne ou les suivantes
                    for j in range(i, min(i + 3, len(lines))):
                        date_match = re.search(r'\b(\d{2})[,\.](\d{2})[,\.](\d{4})\b', lines[j])
                        if date_match:
                            day, month, year = date_match.groups()
                            date_str = f"{day}.{month}.{year}"
                            # Valider l'année (expiration entre 2020 et 2040)
                            if 2020 <= int(year) <= 2040:
                                info['date_expiration'] = date_str
                                break

            # IDENTIFIANT UNIQUE (IDENTIFIANT UNIQUE/UNIQUE IDENTIFIER - format avec chiffres et /)
            if not info.get('identifiant_unique'):
                # Chercher un identifiant avec format type 202/0468908010992 ou 20204689080110992
                id_match = re.search(r'\b(\d{3,4})[/\\]?(\d{10,13})\b', line)
                if id_match:
                    # Nettoyer et reconstruire l'identifiant
                    identifiant = id_match.group(1) + id_match.group(2)
                    # Remplacer les erreurs OCR communes
                    identifiant = identifiant.replace('O', '0').replace('o', '0')
                    if len(identifiant) >= 16:
                        info['identifiant_unique'] = identifiant

            # NUMERO (numéro du permis - 9 chiffres généralement)
            if not info.get('numero'):
                numero_match = re.search(r'\b(\d{9})\b', line)
                if numero_match:
                    numero = numero_match.group(1)
                    # Vérifier que ce n'est pas un autre champ (comme l'identifiant unique)
                    if not info.get('identifiant_unique') or numero not in info['identifiant_unique']:
                        info['numero'] = numero

            # AUTORITE (AUTORITÉ/AUTHORITY - nom de la personne qui a délivré)
            if not info.get('autorite') and ('AUTORITE' in line_upper or 'AUTHORITY' in line_upper):
                # Chercher un nom dans les lignes suivantes
                for j in range(i + 1, min(i + 4, len(lines))):
                    candidate = lines[j].strip()
                    if self._is_valid_autorite(candidate):
                        info['autorite'] = candidate
                        break

        return info

    # Méthodes de validation

    def _is_valid_nom(self, text: str) -> bool:
        """Valide un nom"""
        if not text or len(text) < 2:
            return False
        # Un nom doit être en majuscules et contenir principalement des lettres
        return text.isupper() and len(text) >= 3 and sum(c.isalpha() for c in text) >= len(text) * 0.7

    def _is_valid_prenoms(self, text: str) -> bool:
        """Valide un ou plusieurs prénoms"""
        if not text or len(text) < 2:
            return False
        # Les prénoms peuvent être en majuscules ou en CamelCase
        return len(text) >= 2 and sum(c.isalpha() for c in text) >= len(text) * 0.7

    def _is_valid_lieu(self, text: str) -> bool:
        """Valide un lieu de naissance"""
        if not text or len(text) < 3:
            return False
        # Un lieu doit être en majuscules, entre 3 et 20 caractères
        noise_words = ['LIEU', 'PLACE', 'BIRTH', 'NAISSANCE']
        if any(word in text for word in noise_words):
            return False
        return text.isupper() and 3 <= len(text) <= 20 and text.isalpha()

    def _is_valid_nom_parent(self, text: str, min_words: int = 2) -> bool:
        """Valide un nom de parent (père/mère)"""
        if not text or len(text) < 5:
            return False
        words = text.split()
        if len(words) < min_words:
            return False
        # Doit contenir principalement des lettres
        return sum(c.isalpha() or c.isspace() for c in text) >= len(text) * 0.8

    def _is_valid_adresse(self, text: str) -> bool:
        """Valide une adresse"""
        if not text or len(text) < 3:
            return False
        # Éviter les mots-clés
        noise_words = ['ADRESSE', 'ADDRESS']
        if any(word in text for word in noise_words):
            return False
        return 3 <= len(text) <= 30

    def _is_valid_autorite(self, text: str) -> bool:
        """Valide un nom d'autorité"""
        if not text or len(text) < 5:
            return False
        words = text.split()
        # Une autorité est généralement un nom complet (2+ mots)
        if len(words) < 2:
            return False
        # Doit contenir principalement des lettres et espaces
        return sum(c.isalpha() or c.isspace() for c in text) >= len(text) * 0.8
