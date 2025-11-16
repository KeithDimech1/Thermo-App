#!/usr/bin/env python3
"""
Methods Section Parser

Purpose: Extract metadata from methods section text
Author: Claude Code
Created: 2025-11-16

Features:
- Extract lab info (analyst, laboratory)
- Extract analytical conditions (microscope, objective, etching)
- Extract dosimeter and irradiation info
- Extract software and algorithms
- Extract constants (λ_D, λ_f, zeta)
"""

import logging
import re
from typing import Dict, Optional, List

logger = logging.getLogger(__name__)


class MethodsParser:
    """Extract metadata from methods section"""

    def __init__(self):
        """Initialize parser with pattern libraries"""
        # Common laboratory names
        self.lab_patterns = [
            r'(?:University of |Universit[yé] de? )([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'([A-Z][a-z]+\s+(?:University|Institute|Laboratory))',
            r'(GeoSep Services)',
            r'(Apatite to Zircon)',
        ]

        # Common analyst patterns
        self.analyst_patterns = [
            r'analyzed by ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
            r'analyst[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)',
        ]

        # Microscope and objective
        self.microscope_patterns = [
            r'(Zeiss|Nikon|Olympus|Leica)\s+(?:microscope)?',
            r'(dry|oil)\s+(?:immersion\s+)?objective',
            r'(\d+)×\s+objective',
        ]

        # Etching conditions
        self.etching_patterns = [
            r'etched\s+(?:in\s+)?(\d+\.?\d*)\s*(?:%|M)\s+HNO[₃3]',
            r'etching\s+(?:at\s+)?(\d+)\s*°C\s+for\s+(\d+)\s*(?:s|sec|seconds)',
        ]

        # Dosimeter glass
        self.dosimeter_patterns = [
            r'dosimeter\s+(?:glass\s+)?(?:was\s+)?(CN-?\d+)',
            r'(CN-?\d+)\s+dosimeter',
        ]

        # Software
        self.software_patterns = [
            r'(?:using\s+)?(TrackKey|Trackworks|FastTracks|RadialPlotter)',
            r'(?:using\s+)?(ICP-?MS|LA-?ICP-?MS|EDM)',
        ]

        # Zeta calibration
        self.zeta_patterns = [
            r'zeta[:\s]+(\d+\.?\d*)\s*±\s*(\d+\.?\d*)',
            r'ζ[:\s]+(\d+\.?\d*)\s*±\s*(\d+\.?\d*)',
        ]

    def parse_methods(self, full_text: str) -> Dict:
        """
        Extract metadata from methods section

        Args:
            full_text: Full text of PDF

        Returns:
            Dictionary of metadata fields
        """
        logger.info("Parsing methods section...")

        metadata = {}

        # Find methods section
        methods_text = self._find_methods_section(full_text)

        if not methods_text:
            logger.warning("Could not find methods section")
            methods_text = full_text  # Fallback to full text

        # Extract fields
        metadata['analyst'] = self._extract_analyst(methods_text)
        metadata['laboratory'] = self._extract_laboratory(methods_text)
        metadata['microscope'] = self._extract_microscope(methods_text)
        metadata['objective'] = self._extract_objective(methods_text)
        metadata['etching_conditions'] = self._extract_etching(methods_text)
        metadata['dosimeter'] = self._extract_dosimeter(methods_text)
        metadata['ft_software'] = self._extract_software(methods_text)
        metadata['ft_counting_method'] = self._extract_counting_method(methods_text)
        metadata['ft_algorithm'] = self._extract_algorithm(methods_text)

        # Extract zeta
        zeta_info = self._extract_zeta(methods_text)
        if zeta_info:
            metadata['zeta'] = zeta_info['value']
            metadata['zeta_error'] = zeta_info['error']

        # Extract constants (standard values if not found)
        metadata['lambda_D'] = 1.55125e-10  # 238U decay constant
        metadata['lambda_f'] = 8.46e-17     # 238U fission decay constant

        # Log extracted metadata
        extracted_count = sum(1 for v in metadata.values() if v is not None)
        logger.info(f"Extracted {extracted_count}/{len(metadata)} metadata fields")

        return metadata

    def _find_methods_section(self, text: str) -> Optional[str]:
        """
        Find methods section in text

        Args:
            text: Full text

        Returns:
            Methods section text or None
        """
        # Common methods section headers
        patterns = [
            r'\n\s*(?:METHODS?|ANALYTICAL METHODS?|MATERIALS AND METHODS?)\s*\n',
            r'\n\s*\d+\.?\s+(?:METHODS?|ANALYTICAL METHODS?)\s*\n',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Extract from start of methods to next major section
                start = match.end()

                # Find next section (e.g., "RESULTS", "DISCUSSION")
                next_section = re.search(
                    r'\n\s*(?:RESULTS?|DISCUSSION|CONCLUSIONS?|ACKNOWLEDGEMENTS?)\s*\n',
                    text[start:],
                    re.IGNORECASE
                )

                if next_section:
                    end = start + next_section.start()
                else:
                    # Take next 5000 characters
                    end = start + 5000

                return text[start:end]

        return None

    def _extract_analyst(self, text: str) -> Optional[str]:
        """Extract analyst name"""
        for pattern in self.analyst_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_laboratory(self, text: str) -> Optional[str]:
        """Extract laboratory name"""
        for pattern in self.lab_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_microscope(self, text: str) -> Optional[str]:
        """Extract microscope type"""
        for pattern in self.microscope_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # Return first captured group
                for group in match.groups():
                    if group:
                        return group.strip()
        return None

    def _extract_objective(self, text: str) -> Optional[str]:
        """Extract objective magnification"""
        # Look for patterns like "100×", "dry objective", "oil immersion"
        patterns = [
            r'(\d+)×\s+(?:dry|oil)?\s*(?:immersion\s+)?objective',
            r'(dry|oil)\s+immersion\s+objective',
        ]

        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_etching(self, text: str) -> Optional[str]:
        """Extract etching conditions"""
        # Example: "5.5% HNO3 at 21°C for 20 seconds"
        pattern = r'(\d+\.?\d*)\s*(?:%|M)\s+HNO[₃3]\s+(?:at\s+)?(\d+)\s*°C\s+for\s+(\d+)\s*(?:s|sec|seconds)'

        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            acid_conc = match.group(1)
            temp = match.group(2)
            duration = match.group(3)
            return f"{acid_conc}% HNO3 at {temp}°C for {duration}s"

        # Try simpler patterns
        simple_patterns = [
            r'(\d+\.?\d*)\s*(?:%|M)\s+HNO[₃3]',
            r'etching\s+(?:at\s+)?(\d+)\s*°C',
        ]

        for pattern in simple_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0).strip()

        return None

    def _extract_dosimeter(self, text: str) -> Optional[str]:
        """Extract dosimeter glass type"""
        for pattern in self.dosimeter_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_software(self, text: str) -> Optional[str]:
        """Extract software used"""
        for pattern in self.software_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_counting_method(self, text: str) -> Optional[str]:
        """Extract FT counting method"""
        methods = ['EDM', 'LA-ICP-MS', 'external detector', 'laser ablation']

        text_lower = text.lower()
        for method in methods:
            if method.lower() in text_lower:
                return method.upper() if method.isupper() else method
        return None

    def _extract_algorithm(self, text: str) -> Optional[str]:
        """Extract FT age calculation algorithm"""
        algorithms = ['zeta', 'absolute age', 'isochron']

        text_lower = text.lower()
        for algo in algorithms:
            if algo.lower() in text_lower:
                return algo.capitalize()
        return None

    def _extract_zeta(self, text: str) -> Optional[Dict]:
        """
        Extract zeta calibration value

        Returns:
            Dict with 'value' and 'error' or None
        """
        for pattern in self.zeta_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                try:
                    value = float(match.group(1))
                    error = float(match.group(2))
                    return {'value': value, 'error': error}
                except ValueError:
                    continue
        return None

    def extract_mineral_type(self, text: str) -> Optional[str]:
        """Extract mineral type (apatite, zircon)"""
        minerals = ['apatite', 'zircon']

        text_lower = text.lower()
        for mineral in minerals:
            if mineral in text_lower:
                return mineral.capitalize()
        return None

    def extract_reactor(self, text: str) -> Optional[str]:
        """Extract irradiation reactor"""
        # Common reactors
        reactors = [
            r'(Oregon State University TRIGA reactor)',
            r'(OSU TRIGA)',
            r'(FRM II)',
        ]

        for pattern in reactors:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None
