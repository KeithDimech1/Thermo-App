# InteractiveTable

**Path:** `components/tables/InteractiveTable.tsx`
**Type:** Client Component
**Last Analyzed:** 2025-11-16
**File Size:** 208 lines

## What It Does

A reusable React component that displays thermochronology data in an interactive, sortable, paginated table. Uses TanStack Table (React Table v8) for advanced table features like client-side sorting UI combined with server-side pagination.

## Database Interactions

**Indirect (via API):**
This component does not directly access the database. It fetches data from `/api/tables/[name]` which queries the database tables:
- `samples`
- `ft_ages`
- `ft_counts`
- `ft_track_lengths`
- `ahe_grain_data`

API calls at line 50 fetch paginated, sorted data.

### Database Documentation
→ See [API route docs](../../app/api/tables/[name]/route.md) for database interaction details

## Key Exports
- `InteractiveTable` (default) - Interactive table component with sorting and pagination

## Component Props

**InteractiveTableProps:**
- `tableName: string` - Table identifier to fetch (e.g., "samples", "ft-ages")
- `columns: ColumnDef<TableData>[]` - TanStack Table column definitions

## Component State
- `data` - Current page of table data
- `loading` - Loading state for async data fetch
- `error` - Error message if fetch fails
- `sorting` - Current sort state (column + direction)
- `pagination` - Current page index and page size
- `totalPages` - Total number of pages available
- `total` - Total number of rows in dataset

## Features

**Sorting:**
- Client-side sort UI (click column headers)
- Server-side sorting execution (via API)
- Visual indicators (↑ ↓ ↕) for sort state

**Pagination:**
- Server-side pagination (efficient for large datasets)
- Configurable page sizes (25, 50, 100, 250)
- First/Previous/Next/Last navigation buttons
- Page counter display

**Data Fetching:**
- Automatic refetch on sort/pagination changes
- Loading and error states
- URL parameter construction for API calls

## Dependencies

**External packages:**
- react (useState, useEffect hooks)
- @tanstack/react-table (table functionality)
  - useReactTable
  - getCoreRowModel
  - getSortedRowModel
  - flexRender
  - ColumnDef, SortingState types

**Internal imports:**
- None (pure client component)

## Used By
- `app/tables/page.tsx:6` - Tables page that displays interactive table viewer

## Notes
- **Performance:** Uses server-side pagination to avoid loading entire datasets
- **State Management:** useEffect triggers data refetch when dependencies change (sort/pagination)
- **Error Handling:** Displays user-friendly error messages in red alert box
- **Styling:** Tailwind CSS for responsive, modern table design
- **Accessibility:** Hover states, disabled button states, clear visual feedback
- **Type Safety:** Generic TableData type allows flexible column definitions

## Usage Example
```tsx
<InteractiveTable
  tableName="samples"
  columns={[
    { accessorKey: 'sample_id', header: 'Sample ID' },
    { accessorKey: 'latitude', header: 'Latitude' },
    // ... more columns
  ]}
/>
```

## Related Files
- `app/api/tables/[name]/route.ts` - Backend API that provides the data
- `components/tables/TableSelector.tsx` - Component to select which table to display
