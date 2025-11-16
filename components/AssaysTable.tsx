/**
 * AssaysTable Component
 *
 * Client component for browsing test configurations with:
 * - Excel-style column filters (marker, assay, manufacturer, disease)
 * - Pagination (50 results per page)
 * - CV quality filtering
 * - Search functionality
 * - Column sorting
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/Table';
import { QualityBadge, DatasetBadge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { getManufacturerTooltip, getPlatformTooltip } from '@/lib/terminology';

interface Config {
  config_id: number;
  marker_id: number;
  marker_name: string;
  assay_id: number;
  assay_name: string;
  manufacturer_id: number;
  manufacturer_name: string;
  platform: string | null;
  inclusion_group: string | null;
  cv_lt_10_percentage: number | null;
  events_examined: number | null;
  quality_rating: string | null;
  pathogen_id: number;
  pathogen_name: string;
}

interface FilterOption {
  id: number;
  name: string;
  abbreviation?: string;
}

interface FilterOptions {
  pathogens: FilterOption[];
  markers: FilterOption[];
  manufacturers: FilterOption[];
  assays: FilterOption[];
}

interface AssaysTableProps {
  dataset: 'curated' | 'all';
}

type CVFilter = 'all' | 'lt10' | 'gt10' | 'gt15' | 'gt20';
type SortField = 'marker_name' | 'assay_name' | 'manufacturer_name' | 'cv_lt_10_percentage';
type SortOrder = 'asc' | 'desc';

// Excel-style dropdown filter component
function ColumnFilter({
  label,
  options,
  selected,
  onSelect,
  onClear: _onClear,
}: {
  label: string;
  options: FilterOption[];
  selected: number[];
  onSelect: (ids: number[]) => void;
  onClear: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    return undefined;
  }, [isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleOption = (id: number) => {
    if (selected.includes(id)) {
      onSelect(selected.filter(i => i !== id));
    } else {
      onSelect([...selected, id]);
    }
  };

  const selectAll = () => {
    onSelect(filteredOptions.map(opt => opt.id));
  };

  const deselectAll = () => {
    onSelect([]);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        className={`text-xs px-2 py-1 rounded border ${
          selected.length > 0
            ? 'bg-blue-100 border-blue-500 text-blue-700'
            : 'bg-gray-100 border-gray-300 text-gray-600'
        } hover:bg-gray-200`}
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering sort when clicking filter
          setIsOpen(!isOpen);
        }}
      >
        🔽 {selected.length > 0 ? `(${selected.length})` : ''}
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder={`Search ${label}...`}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="p-2 border-b flex gap-2">
            <button
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={selectAll}
            >
              Select All
            </button>
            <button
              className="text-xs px-2 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              onClick={deselectAll}
            >
              Clear
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredOptions.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-100 cursor-pointer text-sm"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.id)}
                  onChange={() => toggleOption(option.id)}
                  className="rounded"
                />
                <span className="truncate">{option.name}</span>
              </label>
            ))}
            {filteredOptions.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">No results</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssaysTable({ dataset }: AssaysTableProps) {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cvFilter, setCvFilter] = useState<CVFilter>('all');
  const [totalPages, setTotalPages] = useState(0);

  // Filter options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    pathogens: [],
    markers: [],
    manufacturers: [],
    assays: [],
  });

  // Selected filters
  const [selectedPathogens, setSelectedPathogens] = useState<number[]>([]);
  const [selectedMarkers, setSelectedMarkers] = useState<number[]>([]);
  const [selectedManufacturers, setSelectedManufacturers] = useState<number[]>([]);
  const [selectedAssays, setSelectedAssays] = useState<number[]>([]);

  const [sortBy, setSortBy] = useState<SortField>('cv_lt_10_percentage');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const limit = 50;

  // Fetch filter options on mount
  useEffect(() => {
    async function fetchFilters() {
      try {
        const response = await fetch(`/api/filters?dataset=${dataset}`);
        const data = await response.json();
        setFilterOptions(data);
      } catch (error) {
        console.error('Error fetching filter options:', error);
      }
    }
    fetchFilters();
  }, [dataset]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const offset = (page - 1) * limit;
        const params = new URLSearchParams({
          dataset,
          limit: limit.toString(),
          offset: offset.toString(),
          sort_by: sortBy,
          sort_order: sortOrder,
        });

        if (search) params.append('search', search);
        if (cvFilter !== 'all') params.append('cv_filter', cvFilter);
        if (selectedPathogens.length > 0) params.append('pathogen_ids', selectedPathogens.join(','));
        if (selectedMarkers.length > 0) params.append('marker_ids', selectedMarkers.join(','));
        if (selectedManufacturers.length > 0) params.append('manufacturer_ids', selectedManufacturers.join(','));
        if (selectedAssays.length > 0) params.append('assay_ids', selectedAssays.join(','));

        const response = await fetch(`/api/configs?${params}`);
        const data = await response.json();

        setConfigs(data.data || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } catch (error) {
        console.error('Error fetching configs:', error);
        setConfigs([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [page, search, cvFilter, dataset, selectedPathogens, selectedMarkers, selectedManufacturers, selectedAssays, sortBy, sortOrder]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, cvFilter, dataset, selectedPathogens, selectedMarkers, selectedManufacturers, selectedAssays]);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const cvFilterButtons: { value: CVFilter; label: string }[] = [
    { value: 'all', label: 'All Quality Ratings' },
    { value: 'lt10', label: '<10% CV = 100%' },
    { value: 'gt10', label: '<10% CV <90%' },
    { value: 'gt15', label: '<10% CV <85%' },
    { value: 'gt20', label: '<10% CV <80%' },
  ];

  const hasActiveFilters = selectedPathogens.length > 0 || selectedMarkers.length > 0 ||
                           selectedManufacturers.length > 0 || selectedAssays.length > 0;

  const clearAllFilters = () => {
    setSelectedPathogens([]);
    setSelectedMarkers([]);
    setSelectedManufacturers([]);
    setSelectedAssays([]);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card variant="bordered">
        <CardContent className="py-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search by marker, assay, manufacturer, or platform..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* CV Quality Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by CV Performance
              </label>
              <div className="flex flex-wrap gap-2">
                {cvFilterButtons.map((button) => (
                  <Button
                    key={button.value}
                    variant={cvFilter === button.value ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCvFilter(button.value)}
                  >
                    {button.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Active filters indicator */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-blue-600 font-medium">
                  Active column filters:
                  {selectedPathogens.length > 0 && ` Diseases(${selectedPathogens.length})`}
                  {selectedMarkers.length > 0 && ` Markers(${selectedMarkers.length})`}
                  {selectedManufacturers.length > 0 && ` Manufacturers(${selectedManufacturers.length})`}
                  {selectedAssays.length > 0 && ` Assays(${selectedAssays.length})`}
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  Clear All Filters
                </button>
              </div>
            )}

            {/* Results count */}
            <div className="text-sm text-gray-600">
              Showing {configs.length > 0 ? (page - 1) * limit + 1 : 0} -{' '}
              {Math.min(page * limit, total)} of {total} configurations
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <Card variant="bordered">
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">⏳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Loading assays...
            </h3>
          </CardContent>
        </Card>
      ) : configs.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('marker_name')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Marker {getSortIcon('marker_name')}</span>
                    <ColumnFilter
                      label="Markers"
                      options={filterOptions.markers}
                      selected={selectedMarkers}
                      onSelect={setSelectedMarkers}
                      onClear={() => setSelectedMarkers([])}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('assay_name')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Assay {getSortIcon('assay_name')}</span>
                    <ColumnFilter
                      label="Assays"
                      options={filterOptions.assays}
                      selected={selectedAssays}
                      onSelect={setSelectedAssays}
                      onClear={() => setSelectedAssays([])}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('manufacturer_name')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Manufacturer {getSortIcon('manufacturer_name')}</span>
                    <ColumnFilter
                      label="Manufacturers"
                      options={filterOptions.manufacturers}
                      selected={selectedManufacturers}
                      onSelect={setSelectedManufacturers}
                      onClear={() => setSelectedManufacturers([])}
                    />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center justify-between gap-2">
                    <span>Disease</span>
                    <ColumnFilter
                      label="Diseases"
                      options={filterOptions.pathogens}
                      selected={selectedPathogens}
                      onSelect={setSelectedPathogens}
                      onClear={() => setSelectedPathogens([])}
                    />
                  </div>
                </TableHead>
                <TableHead>Platform</TableHead>
                {dataset === 'all' && <TableHead>Dataset</TableHead>}
                <TableHead
                  className="text-right cursor-pointer hover:bg-gray-50 select-none"
                  onClick={() => handleSort('cv_lt_10_percentage')}
                >
                  <div className="flex items-center justify-end gap-1">
                    CV &lt;10% {getSortIcon('cv_lt_10_percentage')}
                  </div>
                </TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead>Quality</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs.map((config) => (
                <TableRow key={config.config_id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/markers/${config.marker_id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {config.marker_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/configs/${config.config_id}`}
                      className="hover:text-blue-600"
                    >
                      {config.assay_name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Tooltip content={getManufacturerTooltip(config.manufacturer_name)}>
                      <Link
                        href={`/manufacturers/${config.manufacturer_id}`}
                        className="text-gray-600 hover:text-blue-600 cursor-help"
                      >
                        {config.manufacturer_name}
                      </Link>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {config.pathogen_name}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {config.platform ? (
                      <Tooltip content={getPlatformTooltip(config.platform)}>
                        <span className="cursor-help">{config.platform}</span>
                      </Tooltip>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  {dataset === 'all' && (
                    <TableCell>
                      {config.inclusion_group && (
                        <DatasetBadge inclusionGroup={config.inclusion_group} size="sm" />
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-medium">
                    {config.cv_lt_10_percentage !== null
                      ? `${Number(config.cv_lt_10_percentage).toFixed(1)}%`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right text-gray-600">
                    {config.events_examined || '-'}
                  </TableCell>
                  <TableCell>
                    {config.quality_rating && (
                      <QualityBadge rating={config.quality_rating as 'excellent' | 'good' | 'acceptable' | 'poor'} size="sm" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-md">
              <div className="flex flex-1 justify-between sm:hidden">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >
                    First
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card variant="bordered">
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No assays found
            </h3>
            <p className="text-gray-600">
              {search || hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Configure your database connection to load assay data'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
