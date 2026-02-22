import { createContext } from 'react';
import { emptyFn } from '@/lib/utils';
import type Nango from '@nangohq/frontend';

export interface NangoConnection {
    providerConfigKey: string;
    connectionId: string;
    connected: boolean;
}

export interface NangoContext {
    nango: Nango | null;
    isLoading: boolean;
    connections: NangoConnection[];
    connect: (
        providerConfigKey: string,
        connectionId?: string
    ) => Promise<void>;
    disconnect: (connectionId: string) => Promise<void>;
    getConnection: (connectionId: string) => NangoConnection | undefined;
    isConnected: (connectionId: string) => boolean;
}

export const NangoContext = createContext<NangoContext>({
    nango: null,
    isLoading: true,
    connections: [],
    connect: emptyFn,
    disconnect: emptyFn,
    getConnection: () => undefined,
    isConnected: () => false,
});
