'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    // Navigation
    datasets: 'Datasets',
    overview: 'Overview',
    pdfs: 'PDFs',
    figures: 'Figures',
    tables: 'Tables',
    thermoFAIR: 'ThermoFAIR',
    databaseTables: 'Database Tables',
    analysis: 'Analysis',
    dataTables: 'Data Tables',

    // Common UI elements
    downloadCSV: 'Download CSV',
    downloadXLSX: 'Download XLSX',
    previewData: 'Preview Data',
    download: 'Download',
    downloadImage: 'Download Image',

    // Data Tables page
    tableScreenshotPairedData: 'Table screenshots paired with extracted CSV data files',
    noTableDataAvailable: 'No table data available.',
    tableScreenshot: 'Table Screenshot',
    extractedData: 'Extracted Data',
    noCSVExtracted: 'No CSV data extracted for this table',
    downloadImageToView: 'Download the image to view the table',
    noTableScreenshot: 'No table screenshot available',
    downloadCSVToView: 'Download the CSV to view the data',

    // Figures page
    figureImagesFromPaper: 'Figure images from the paper',
    noFigureImages: 'No figure images available.',

    // File info
    rows: 'rows',
    file: 'File',
  },
  es: {
    // Navigation
    datasets: 'Conjuntos de datos',
    overview: 'Resumen',
    pdfs: 'PDFs',
    figures: 'Figuras',
    tables: 'Tablas',
    thermoFAIR: 'ThermoFAIR',
    databaseTables: 'Tablas de base de datos',
    analysis: 'Análisis',
    dataTables: 'Tablas de datos',

    // Common UI elements
    downloadCSV: 'Descargar CSV',
    downloadXLSX: 'Descargar XLSX',
    previewData: 'Vista previa de datos',
    download: 'Descargar',
    downloadImage: 'Descargar imagen',

    // Data Tables page
    tableScreenshotPairedData: 'Capturas de pantalla de tablas emparejadas con archivos de datos CSV extraídos',
    noTableDataAvailable: 'No hay datos de tabla disponibles.',
    tableScreenshot: 'Captura de tabla',
    extractedData: 'Datos extraídos',
    noCSVExtracted: 'No se extrajeron datos CSV para esta tabla',
    downloadImageToView: 'Descargue la imagen para ver la tabla',
    noTableScreenshot: 'No hay captura de pantalla de tabla disponible',
    downloadCSVToView: 'Descargue el CSV para ver los datos',

    // Figures page
    figureImagesFromPaper: 'Imágenes de figuras del artículo',
    noFigureImages: 'No hay imágenes de figuras disponibles.',

    // File info
    rows: 'filas',
    file: 'Archivo',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
