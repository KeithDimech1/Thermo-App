/**
 * FilterPanel Component
 *
 * Comprehensive filtering interface for test configurations with:
 * - Search
 * - Multi-select filters (manufacturer, marker, category, quality)
 * - Active filter chips
 * - Clear all functionality
 * - URL query parameter sync
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterPanelProps {
  manufacturers?: FilterOption[];
  markers?: FilterOption[];
  categories?: FilterOption[];
  onFilterChange?: (filters: FilterState) => void;
  showSearch?: boolean;
  showManufacturers?: boolean;
  showMarkers?: boolean;
  showCategories?: boolean;
  showQuality?: boolean;
  showTestType?: boolean;
}

export interface FilterState {
  search: string;
  manufacturers: string[];
  markers: string[];
  categories: string[];
  quality: string[];
  testType: string[];
}

const QUALITY_OPTIONS: FilterOption[] = [
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'acceptable', label: 'Acceptable' },
  { value: 'poor', label: 'Poor' },
];

const TEST_TYPE_OPTIONS: FilterOption[] = [
  { value: 'serology', label: 'Serology' },
  { value: 'nat', label: 'NAT (Nucleic Acid)' },
];

export function FilterPanel({
  manufacturers = [],
  markers = [],
  categories = [],
  onFilterChange,
  showSearch = true,
  showManufacturers = true,
  showMarkers = true,
  showCategories = true,
  showQuality = true,
  showTestType = true,
}: FilterPanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const [filters, setFilters] = useState<FilterState>({
    search: searchParams.get('search') || '',
    manufacturers: searchParams.getAll('manufacturer'),
    markers: searchParams.getAll('marker'),
    categories: searchParams.getAll('category'),
    quality: searchParams.getAll('quality'),
    testType: searchParams.getAll('type'),
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.search) params.set('search', filters.search);
    filters.manufacturers.forEach((m) => params.append('manufacturer', m));
    filters.markers.forEach((m) => params.append('marker', m));
    filters.categories.forEach((c) => params.append('category', c));
    filters.quality.forEach((q) => params.append('quality', q));
    filters.testType.forEach((t) => params.append('type', t));

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    router.push(newUrl, { scroll: false });

    // Notify parent component
    if (onFilterChange) {
      onFilterChange(filters);
    }
  }, [filters, pathname, router, onFilterChange]);

  const handleSearchChange = (value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleToggleFilter = (
    filterKey: keyof Omit<FilterState, 'search'>,
    value: string
  ) => {
    setFilters((prev) => {
      const currentValues = prev[filterKey];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return { ...prev, [filterKey]: newValues };
    });
  };

  const handleClearAll = () => {
    setFilters({
      search: '',
      manufacturers: [],
      markers: [],
      categories: [],
      quality: [],
      testType: [],
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.manufacturers.length > 0 ||
    filters.markers.length > 0 ||
    filters.categories.length > 0 ||
    filters.quality.length > 0 ||
    filters.testType.length > 0;

  const activeFilterCount =
    filters.manufacturers.length +
    filters.markers.length +
    filters.categories.length +
    filters.quality.length +
    filters.testType.length +
    (filters.search ? 1 : 0);

  return (
    <Card variant="bordered">
      <CardContent className="py-4 space-y-4">
        {/* Search Bar */}
        {showSearch && (
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="search"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by marker, assay, or manufacturer..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <Button
              variant={isExpanded ? 'primary' : 'secondary'}
              size="md"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? '▲ Hide Filters' : '▼ Advanced Filters'}
              {activeFilterCount > 0 && (
                <Badge variant="default" size="sm" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </div>
        )}

        {/* Advanced Filters (Collapsible) */}
        {isExpanded && (
          <div className="pt-4 border-t border-gray-200 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Quality Rating */}
              {showQuality && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Rating
                  </label>
                  <div className="space-y-2">
                    {QUALITY_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.quality.includes(option.value)}
                          onChange={() => handleToggleFilter('quality', option.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Test Type */}
              {showTestType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Type
                  </label>
                  <div className="space-y-2">
                    {TEST_TYPE_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.testType.includes(option.value)}
                          onChange={() => handleToggleFilter('testType', option.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Manufacturers */}
              {showManufacturers && manufacturers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manufacturer
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {manufacturers.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.manufacturers.includes(option.value)}
                          onChange={() =>
                            handleToggleFilter('manufacturers', option.value)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {showCategories && categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.categories.includes(option.value)}
                          onChange={() => handleToggleFilter('categories', option.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Markers */}
              {showMarkers && markers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marker
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {markers.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={filters.markers.includes(option.value)}
                          onChange={() => handleToggleFilter('markers', option.value)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                          {option.count !== undefined && (
                            <span className="text-gray-500 ml-1">({option.count})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Active Filters:</span>
              <Button variant="secondary" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="default" size="md">
                  Search: "{filters.search}"
                  <button
                    onClick={() => handleSearchChange('')}
                    className="ml-2 text-gray-600 hover:text-gray-900"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.quality.map((q) => (
                <Badge key={q} variant="default" size="md">
                  {QUALITY_OPTIONS.find((o) => o.value === q)?.label}
                  <button
                    onClick={() => handleToggleFilter('quality', q)}
                    className="ml-2 text-gray-600 hover:text-gray-900"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {filters.testType.map((t) => (
                <Badge key={t} variant="default" size="md">
                  {TEST_TYPE_OPTIONS.find((o) => o.value === t)?.label}
                  <button
                    onClick={() => handleToggleFilter('testType', t)}
                    className="ml-2 text-gray-600 hover:text-gray-900"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {filters.manufacturers.map((m) => (
                <Badge key={m} variant="default" size="md">
                  {manufacturers.find((o) => o.value === m)?.label || m}
                  <button
                    onClick={() => handleToggleFilter('manufacturers', m)}
                    className="ml-2 text-gray-600 hover:text-gray-900"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {filters.categories.map((c) => (
                <Badge key={c} variant="default" size="md">
                  {categories.find((o) => o.value === c)?.label || c}
                  <button
                    onClick={() => handleToggleFilter('categories', c)}
                    className="ml-2 text-gray-600 hover:text-gray-900"
                  >
                    ×
                  </button>
                </Badge>
              ))}
              {filters.markers.map((m) => (
                <Badge key={m} variant="default" size="md">
                  {markers.find((o) => o.value === m)?.label || m}
                  <button
                    onClick={() => handleToggleFilter('markers', m)}
                    className="ml-2 text-gray-600 hover:text-gray-900"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
