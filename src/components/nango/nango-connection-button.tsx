import React from 'react';
import { useNango } from '@/hooks/use-nango';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export interface NangoConnectionButtonProps {
    providerConfigKey: string;
    connectionId?: string;
    label?: string;
    className?: string;
    onSuccess?: () => void;
    onError?: (error: Error) => void;
}

export const NangoConnectionButton: React.FC<NangoConnectionButtonProps> = ({
    providerConfigKey,
    connectionId,
    label,
    className,
    onSuccess,
    onError,
}) => {
    const { connect, isLoading, isConnected } = useNango();
    const [connecting, setConnecting] = React.useState(false);

    const handleConnect = async () => {
        setConnecting(true);
        try {
            await connect(providerConfigKey, connectionId);
            onSuccess?.();
        } catch (error) {
            onError?.(error as Error);
        } finally {
            setConnecting(false);
        }
    };

    const connected = connectionId
        ? isConnected(connectionId)
        : false;

    if (isLoading) {
        return (
            <Button disabled className={className}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing...
            </Button>
        );
    }

    return (
        <Button
            onClick={handleConnect}
            disabled={connecting || connected}
            className={className}
        >
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {connected
                ? 'Connected'
                : label || `Connect to ${providerConfigKey}`}
        </Button>
    );
};
