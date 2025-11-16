/**
 * MethodologyTooltip Component
 *
 * Educational tooltip/popover explaining different immunoassay methodologies
 * (CLIA, ELISA, ECLIA, etc.) and why they produce different results.
 *
 * Based on Dimech (2021): Different detection systems and antigens mean
 * each platform measures a different "measurand" even for the same marker.
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface MethodologyTooltipProps {
  methodology: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

const methodologyInfo: Record<
  string,
  { name: string; description: string; characteristics: string[] }
> = {
  CLIA: {
    name: 'Chemiluminescent Immunoassay',
    description:
      'Uses chemical reactions that produce light to detect antibodies or antigens.',
    characteristics: [
      'High sensitivity',
      'Wide dynamic range',
      'Fast processing time',
      'Automated platforms',
    ],
  },
  ECLIA: {
    name: 'Electrochemiluminescent Immunoassay',
    description:
      'Uses electrical stimulation to generate light signals for detection.',
    characteristics: [
      'Very high sensitivity',
      'Excellent precision',
      'Wide dynamic range',
      'Minimal matrix interference',
    ],
  },
  ELISA: {
    name: 'Enzyme-Linked Immunosorbent Assay',
    description:
      'Uses enzyme reactions that produce colored products for detection.',
    characteristics: [
      'Well-established method',
      'Good sensitivity',
      'Manual or automated',
      'Widely available',
    ],
  },
  CMIA: {
    name: 'Chemiluminescent Microparticle Immunoassay',
    description:
      'Combines microparticles with chemiluminescent detection for enhanced sensitivity.',
    characteristics: [
      'Excellent sensitivity',
      'Fast processing',
      'High throughput',
      'Reduced sample volume',
    ],
  },
  EIA: {
    name: 'Enzyme Immunoassay',
    description: 'General term for assays using enzyme-based detection.',
    characteristics: [
      'Versatile methodology',
      'Multiple formats available',
      'Good reproducibility',
      'Cost-effective',
    ],
  },
  FEIA: {
    name: 'Fluorescent Enzyme Immunoassay',
    description: 'Uses fluorescent markers for enhanced sensitivity.',
    characteristics: [
      'High sensitivity',
      'Good specificity',
      'Automated processing',
      'Quantitative results',
    ],
  },
};

export function MethodologyTooltip({
  methodology,
  children,
  position = 'top',
}: MethodologyTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize methodology string (remove special characters, uppercase)
  const normalizedMethodology = methodology
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  const info = methodologyInfo[normalizedMethodology];

  // If no info available, just render the children or methodology text
  if (!info) {
    return <>{children || methodology}</>;
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom:
      'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
    right:
      'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className="relative inline-block">
      {/* Trigger */}
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 underline decoration-dotted cursor-help"
      >
        {children || methodology}
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Tooltip */}
      {isOpen && (
        <div
          className={cn(
            'absolute z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg',
            positionClasses[position]
          )}
        >
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-8 border-gray-200',
              arrowClasses[position]
            )}
          />

          {/* Content */}
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                {info.name}
              </h4>
              <p className="text-xs text-gray-600">{info.description}</p>
            </div>

            <div>
              <h5 className="font-medium text-gray-900 text-xs mb-2">
                Characteristics:
              </h5>
              <ul className="space-y-1">
                {info.characteristics.map((char, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <span className="text-green-600 mt-0.5">•</span>
                    <span className="text-gray-600">{char}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-600">
                <span className="font-medium text-gray-900">Important: </span>
                Different methodologies use different antigens and detection systems,
                meaning they measure different things even for the same marker.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Alternative: Simple badge with hover tooltip
 */
export function MethodologyBadge({ methodology }: { methodology: string }) {
  const [isOpen, setIsOpen] = useState(false);

  const normalizedMethodology = methodology
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase();

  const info = methodologyInfo[normalizedMethodology];

  if (!info) {
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">
        {methodology}
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-help"
      >
        {methodology}
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-72 p-3 bg-white border border-gray-200 rounded-lg shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-2">
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-8 border-gray-200 border-l-transparent border-r-transparent border-b-transparent" />

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 text-xs">{info.name}</h4>
            <p className="text-xs text-gray-600">{info.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
