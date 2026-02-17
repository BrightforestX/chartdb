# Nango Integration Guide

This document explains how to use the Nango authentication integration in ChartDB for connecting to external databases.

## Overview

ChartDB now supports [Nango](https://www.nango.dev/) for secure authentication and connection to external database services. This enables you to connect to databases using OAuth and other authentication methods without storing credentials locally.

## Supported Databases

The following database types are supported through Nango integration:

- PostgreSQL
- MySQL
- SurrealDB
- Firestore
- MongoDB

## Setup

### 1. Get Your Nango Public Key

1. Sign up for a Nango account at [https://www.nango.dev/](https://www.nango.dev/)
2. Create a new project in the Nango dashboard
3. Copy your public key from the project settings

### 2. Configure Nango in ChartDB

Add the Nango provider to your application:

```tsx
import { NangoProvider } from '@/context/nango-context';

function App() {
    return (
        <NangoProvider 
            publicKey="YOUR_NANGO_PUBLIC_KEY"
            host="https://api.nango.dev" // Optional, defaults to Nango cloud
        >
            {/* Your app components */}
        </NangoProvider>
    );
}
```

### 3. Set Up Provider Configurations

In your Nango dashboard, configure the database providers you want to support:

1. Go to "Integrations" in the Nango dashboard
2. Add your database provider (e.g., PostgreSQL, MySQL)
3. Configure the OAuth flow or authentication method
4. Note the `providerConfigKey` for each integration

## Usage

### Using the Connection Button Component

The simplest way to add Nango authentication is using the `NangoConnectionButton` component:

```tsx
import { NangoConnectionButton } from '@/components/nango';

function DatabaseConnection() {
    return (
        <NangoConnectionButton
            providerConfigKey="postgresql"
            connectionId="my-postgres-db"
            label="Connect to PostgreSQL"
            onSuccess={() => console.log('Connected!')}
            onError={(error) => console.error('Connection failed:', error)}
        />
    );
}
```

### Using the Nango Hook

For more control, use the `useNango` hook:

```tsx
import { useNango } from '@/hooks/use-nango';

function CustomDatabaseConnection() {
    const { connect, isConnected, connections } = useNango();

    const handleConnect = async () => {
        try {
            await connect('postgresql', 'my-connection-id');
            console.log('Connected successfully!');
        } catch (error) {
            console.error('Connection failed:', error);
        }
    };

    return (
        <div>
            <button onClick={handleConnect}>
                Connect to Database
            </button>
            {isConnected('my-connection-id') && (
                <p>Connected!</p>
            )}
        </div>
    );
}
```

### Using Nango Utilities

The `nango-utils` library provides helper functions for working with database connections:

```tsx
import { 
    getNangoDatabaseConnection,
    testNangoDatabaseConnection,
    NANGO_DATABASE_PROVIDERS 
} from '@/lib/nango';
import { useNango } from '@/hooks/use-nango';

function DatabaseManager() {
    const { nango } = useNango();

    const getConnection = async () => {
        if (!nango) return;
        
        const connection = await getNangoDatabaseConnection(
            nango, 
            'my-connection-id'
        );
        
        if (connection) {
            console.log('Connection details:', connection);
        }
    };

    const testConnection = async () => {
        if (!nango) return;
        
        const isValid = await testNangoDatabaseConnection(
            nango,
            'my-connection-id'
        );
        
        console.log('Connection valid:', isValid);
    };

    return (
        <div>
            <button onClick={getConnection}>Get Connection</button>
            <button onClick={testConnection}>Test Connection</button>
        </div>
    );
}
```

## API Reference

### NangoContext

The main context for Nango integration.

**Properties:**
- `nango: Nango | null` - The Nango SDK instance
- `isLoading: boolean` - Whether Nango is initializing
- `connections: NangoConnection[]` - Active connections
- `connect(providerConfigKey: string, connectionId?: string): Promise<void>` - Connect to a provider
- `disconnect(connectionId: string): Promise<void>` - Disconnect from a provider
- `getConnection(connectionId: string): NangoConnection | undefined` - Get connection details
- `isConnected(connectionId: string): boolean` - Check if a connection is active

### NangoConnectionButton Props

- `providerConfigKey: string` - The Nango provider config key
- `connectionId?: string` - Optional connection identifier
- `label?: string` - Button label text
- `className?: string` - CSS class name
- `onSuccess?: () => void` - Success callback
- `onError?: (error: Error) => void` - Error callback

## Environment Variables

For production deployments, set these environment variables:

```bash
VITE_NANGO_PUBLIC_KEY=your_public_key
VITE_NANGO_HOST=https://api.nango.dev # Optional
```

Then use them in your code:

```tsx
<NangoProvider 
    publicKey={import.meta.env.VITE_NANGO_PUBLIC_KEY}
    host={import.meta.env.VITE_NANGO_HOST}
>
```

## Security Considerations

1. **Never expose your Nango secret key** - Only use the public key in the frontend
2. **Validate connections** - Always verify connections on your backend before processing data
3. **Use connection IDs** - Provide unique connection IDs to isolate different database connections
4. **Implement timeouts** - Set appropriate timeouts for connection attempts

## Troubleshooting

### Connection fails silently

- Check that your Nango public key is correct
- Verify the provider config key matches your Nango dashboard
- Ensure pop-ups are not blocked in the browser

### "Nango not initialized" error

- Make sure the `NangoProvider` wraps your component tree
- Check that the public key is provided to the provider
- Wait for `isLoading` to be `false` before attempting connections

## Examples

See the following template examples for complete implementations:

- [SurrealDB Todos Template](/src/templates-data/templates/surrealdb-todos-db.ts)
- [Firestore Todos Template](/src/templates-data/templates/firestore-todos-db.ts)

## Support

For more information about Nango:
- [Nango Documentation](https://docs.nango.dev/)
- [Nango GitHub](https://github.com/NangoHQ/nango)
- [ChartDB Documentation](https://chartdb.io/docs)
