/**
 * Webhook Controller for event subscriptions
 */

import type { WebhookSubscription, WebhookPayload, ApiResponse } from '../types';
import { nanoid } from 'nanoid';

class WebhookStore {
    private webhooks = new Map<string, WebhookSubscription>();

    save(webhook: WebhookSubscription): void {
        this.webhooks.set(webhook.id, webhook);
    }

    get(id: string): WebhookSubscription | undefined {
        return this.webhooks.get(id);
    }

    list(): WebhookSubscription[] {
        return Array.from(this.webhooks.values());
    }

    delete(id: string): boolean {
        return this.webhooks.delete(id);
    }

    getByEvent(event: string): WebhookSubscription[] {
        return this.list().filter(
            (webhook) => webhook.active && webhook.events.includes(event)
        );
    }
}

export const webhookStore = new WebhookStore();

export class WebhookController {
    async listWebhooks(): Promise<ApiResponse<WebhookSubscription[]>> {
        const webhooks = webhookStore.list();
        return {
            success: true,
            data: webhooks,
        };
    }

    async getWebhook(id: string): Promise<ApiResponse<WebhookSubscription>> {
        const webhook = webhookStore.get(id);

        if (!webhook) {
            return {
                success: false,
                error: 'Webhook not found',
            };
        }

        return {
            success: true,
            data: webhook,
        };
    }

    async createWebhook(data: {
        url: string;
        events: string[];
        secret?: string;
    }): Promise<ApiResponse<WebhookSubscription>> {
        // Validate URL
        try {
            new URL(data.url);
        } catch {
            return {
                success: false,
                error: 'Invalid webhook URL',
            };
        }

        // Validate events
        const validEvents = [
            'diagram.created',
            'diagram.updated',
            'diagram.deleted',
            'table.added',
            'relationship.added',
        ];

        const invalidEvents = data.events.filter(
            (event) => !validEvents.includes(event)
        );

        if (invalidEvents.length > 0) {
            return {
                success: false,
                error: `Invalid events: ${invalidEvents.join(', ')}`,
            };
        }

        const webhook: WebhookSubscription = {
            id: nanoid(),
            url: data.url,
            events: data.events,
            active: true,
            secret: data.secret || nanoid(),
            createdAt: new Date().toISOString(),
        };

        webhookStore.save(webhook);

        return {
            success: true,
            data: webhook,
            message: 'Webhook created successfully',
        };
    }

    async updateWebhook(
        id: string,
        updates: Partial<Omit<WebhookSubscription, 'id' | 'createdAt'>>
    ): Promise<ApiResponse<WebhookSubscription>> {
        const webhook = webhookStore.get(id);

        if (!webhook) {
            return {
                success: false,
                error: 'Webhook not found',
            };
        }

        const updated = {
            ...webhook,
            ...updates,
        };

        webhookStore.save(updated);

        return {
            success: true,
            data: updated,
            message: 'Webhook updated successfully',
        };
    }

    async deleteWebhook(id: string): Promise<ApiResponse<void>> {
        const deleted = webhookStore.delete(id);

        if (!deleted) {
            return {
                success: false,
                error: 'Webhook not found',
            };
        }

        return {
            success: true,
            message: 'Webhook deleted successfully',
        };
    }

    async triggerWebhooks(
        event: string,
        data: any
    ): Promise<{ sent: number; failed: number }> {
        const webhooks = webhookStore.getByEvent(event);
        let sent = 0;
        let failed = 0;

        const payload: WebhookPayload = {
            event: event as any,
            timestamp: new Date().toISOString(),
            data,
        };

        // Send webhooks in parallel
        await Promise.allSettled(
            webhooks.map(async (webhook) => {
                try {
                    await this.sendWebhook(webhook, payload);
                    sent++;
                } catch (error) {
                    console.error(
                        `Failed to send webhook ${webhook.id}:`,
                        error
                    );
                    failed++;
                }
            })
        );

        return { sent, failed };
    }

    private async sendWebhook(
        webhook: WebhookSubscription,
        payload: WebhookPayload
    ): Promise<void> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'User-Agent': 'ChartDB-Webhook/1.0',
            'X-ChartDB-Event': payload.event,
            'X-ChartDB-Timestamp': payload.timestamp,
        };

        if (webhook.secret) {
            // In production, sign the payload with HMAC
            headers['X-ChartDB-Signature'] = webhook.secret;
        }

        // In a real implementation, use fetch or axios
        // For now, we'll just log
        console.log('Sending webhook:', {
            url: webhook.url,
            event: payload.event,
            payload,
        });

        // Simulate HTTP request
        // await fetch(webhook.url, {
        //     method: 'POST',
        //     headers,
        //     body: JSON.stringify(payload),
        // });
    }
}

export const webhookController = new WebhookController();
