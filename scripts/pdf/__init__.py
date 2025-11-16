"""
Universal Thermochronology PDF Extraction Engine

Main modules:
- extraction_engine: Core extraction orchestrator
- semantic_analysis: Document structure understanding
- table_extractors: Multi-method table extraction
- fair_transformer: FAIR schema transformation
- methods_parser: Methods section text mining
- validators: Domain-specific validation
- cleaners: Post-extraction cleaning
- cache: Caching layer
"""

from .extraction_engine import UniversalThermoExtractor, extract_from_pdf

__all__ = ['UniversalThermoExtractor', 'extract_from_pdf']
