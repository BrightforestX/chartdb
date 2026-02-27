import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/table/table';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
    id: string;
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
}

export interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
    onRowClick?: (row: T, index: number) => void;
    selectedIds?: Set<string>;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    keyExtractor,
    onRowClick,
    selectedIds,
    className,
}: DataTableProps<T>) {
    return (
        <div
            className={cn('w-full overflow-auto rounded-md border', className)}
        >
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col.id} className={col.className}>
                                {col.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row, index) => {
                        const key = keyExtractor(row);
                        const isSelected = selectedIds?.has(key);

                        return (
                            <TableRow
                                key={key}
                                onClick={() => onRowClick?.(row, index)}
                                className={cn(
                                    onRowClick && 'cursor-pointer',
                                    isSelected && 'bg-muted/50'
                                )}
                            >
                                {columns.map((col) => (
                                    <TableCell
                                        key={col.id}
                                        className={col.className}
                                    >
                                        {typeof col.accessor === 'function'
                                            ? col.accessor(row)
                                            : String(
                                                  (
                                                      row as Record<
                                                          string,
                                                          unknown
                                                      >
                                                  )[col.accessor as string] ??
                                                      ''
                                              )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
