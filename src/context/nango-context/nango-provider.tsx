import React, { useEffect, useState, useCallback } from 'react';
import { NangoContext } from './nango-context';
import type { NangoConnection } from './nango-context';
import Nango from '@nangohq/frontend';

export interface NangoProviderProps {
    publicKey?: string;
    host?: string;
}

export const NangoProvider: React.FC<
    React.PropsWithChildren<NangoProviderProps>
> = ({ children, publicKey, host }) => {
    const [nango, setNango] = useState<Nango | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [connections, setConnections] = useState<NangoConnection[]>([]);

    useEffect(() => {
        const initNango = async () => {
            try {
                // Only initialize Nango if a public key is provided
                if (!publicKey) {
                    setIsLoading(false);
                    return;
                }

                const nangoInstance = new Nango({
                    publicKey,
                    host,
                });

                setNango(nangoInstance);
            } catch (error) {
                console.error('Failed to initialize Nango:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initNango();
    }, [publicKey, host]);

    const connect = useCallback(
        async (providerConfigKey: string, connectionId?: string) => {
            if (!nango) {
                throw new Error('Nango not initialized');
            }

            try {
                const result = await nango.auth(providerConfigKey, connectionId);

                if (result) {
                    const newConnection: NangoConnection = {
                        providerConfigKey,
                        connectionId: connectionId || providerConfigKey,
                        connected: true,
                    };

                    setConnections((prev) => {
                        const existing = prev.find(
                            (c) => c.connectionId === newConnection.connectionId
                        );
                        if (existing) {
                            return prev.map((c) =>
                                c.connectionId === newConnection.connectionId
                                    ? newConnection
                                    : c
                            );
                        }
                        return [...prev, newConnection];
                    });
                }
            } catch (error) {
                console.error('Nango connection failed:', error);
                throw error;
            }
        },
        [nango]
    );

    const disconnect = useCallback(async (connectionId: string) => {
        setConnections((prev) =>
            prev.filter((c) => c.connectionId !== connectionId)
        );
    }, []);

    const getConnection = useCallback(
        (connectionId: string) => {
            return connections.find((c) => c.connectionId === connectionId);
        },
        [connections]
    );

    const isConnected = useCallback(
        (connectionId: string) => {
            const connection = connections.find(
                (c) => c.connectionId === connectionId
            );
            return connection?.connected ?? false;
        },
        [connections]
    );

    return (
        <NangoContext.Provider
            value={{
                nango,
                isLoading,
                connections,
                connect,
                disconnect,
                getConnection,
                isConnected,
            }}
        >
            {children}
        </NangoContext.Provider>
    );
};
