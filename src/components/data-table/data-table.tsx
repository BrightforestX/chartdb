import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

export interface DataTableColumn<T> {
    id: string;
    header: string;
    accessorKey?: keyof T;
    accessorFn?: (row: T) => React.ReactNode;
    sortable?: boolean;
    className?: string;
}

export interface DataTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    sortable?: boolean;
    className?: string;
    emptyMessage?: string;
}

function DataTableInner<T extends Record<string, unknown>>(
    {
        data,
        columns,
        sortable = true,
        className,
        emptyMessage = 'No data',
    }: DataTableProps<T>,
    ref: React.Ref<HTMLDivElement>
) {
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        const config = sortConfig;
        const col = columns.find((c) => c.id === config.key);
        const canSort = col && (col.sortable ?? sortable);
        const accessor = col?.accessorKey || col?.accessorFn;
        if (!canSort || !accessor) return data;

        return [...data].sort((a, b) => {
            const aVal =
                typeof accessor === 'function'
                    ? accessor(a)
                    : (a[col.accessorKey as keyof T] as string | number);
            const bVal =
                typeof accessor === 'function'
                    ? accessor(b)
                    : (b[col.accessorKey as keyof T] as string | number);

            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return config.direction === 'asc' ? 1 : -1;
            if (bVal == null) return config.direction === 'asc' ? -1 : 1;

            const aStr = String(aVal);
            const bStr = String(bVal);
            const cmp =
                typeof aVal === 'number' && typeof bVal === 'number'
                    ? aVal - bVal
                    : aStr.localeCompare(bStr);

            return config.direction === 'asc' ? cmp : -cmp;
        });
    }, [data, sortConfig, columns, sortable]);

    const handleSort = (columnId: string) => {
        const col = columns.find((c) => c.id === columnId);
        const canSort = col && (col.sortable ?? sortable);
        if (!canSort || (!col.accessorKey && !col.accessorFn)) return;

        setSortConfig((prev) =>
            prev?.key === columnId
                ? prev.direction === 'asc'
                    ? { key: columnId, direction: 'desc' }
                    : null
                : { key: columnId, direction: 'asc' }
        );
    };

    const getCellValue = (
        row: T,
        column: DataTableColumn<T>
    ): React.ReactNode => {
        if (column.accessorFn) return column.accessorFn(row);
        if (column.accessorKey)
            return row[column.accessorKey] as React.ReactNode;
        return null;
    };

    return (
        <div
            ref={ref}
            className={cn('relative w-full overflow-auto', className)}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead
                                key={column.id}
                                className={cn(
                                    column.className,
                                    (column.sortable || sortable) &&
                                        'cursor-pointer'
                                )}
                                onClick={() =>
                                    (column.sortable || sortable) &&
                                    handleSort(column.id)
                                }
                            >
                                <div
                                    className={cn(
                                        'flex items-center gap-1',
                                        (column.sortable || sortable) &&
                                            'select-none hover:text-foreground'
                                    )}
                                >
                                    {column.header}
                                    {(column.sortable || sortable) &&
                                        (column.accessorKey ||
                                            column.accessorFn) && (
                                            <span className="shrink-0">
                                                {sortConfig?.key ===
                                                column.id ? (
                                                    sortConfig.direction ===
                                                    'asc' ? (
                                                        <ChevronUp className="size-4" />
                                                    ) : (
                                                        <ChevronDown className="size-4" />
                                                    )
                                                ) : (
                                                    <ChevronsUpDown className="size-4 opacity-50" />
                                                )}
                                            </span>
                                        )}
                                </div>
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedData.length === 0 ? (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length}
                                className="h-24 text-center text-muted-foreground"
                            >
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedData.map((row, index) => (
                            <TableRow key={index}>
                                {columns.map((column) => (
                                    <TableCell
                                        key={column.id}
                                        className={column.className}
                                    >
                                        {getCellValue(row, column)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

const DataTable = React.forwardRef(DataTableInner) as <
    T extends Record<string, unknown>,
>(
    props: DataTableProps<T> & { ref?: React.Ref<HTMLDivElement> }
) => React.ReactElement;

export { DataTable };
