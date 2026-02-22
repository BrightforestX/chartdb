/**
 * Agent Execution Pipeline
 * Flexible pipeline for orchestrating agent workflows
 */

export type PipelineStage<TInput, TOutput> = {
    name: string;
    execute: (input: TInput) => Promise<TOutput>;
    condition?: (input: TInput) => boolean;
    retryCount?: number;
    timeout?: number;
};

export type PipelineMiddleware<T = any> = {
    before?: (stageName: string, input: T) => Promise<void> | void;
    after?: (stageName: string, output: T) => Promise<void> | void;
    onError?: (stageName: string, error: Error) => Promise<void> | void;
};

export interface PipelineResult<T> {
    success: boolean;
    data?: T;
    error?: Error;
    stages: Array<{
        name: string;
        executed: boolean;
        skipped: boolean;
        duration: number;
        error?: string;
    }>;
    totalDuration: number;
}

export class AgentPipeline<TInput = any, TOutput = any> {
    private stages: Array<PipelineStage<any, any>> = [];
    private middleware: PipelineMiddleware[] = [];

    /**
     * Add a stage to the pipeline
     */
    addStage<TStageInput, TStageOutput>(
        stage: PipelineStage<TStageInput, TStageOutput>
    ): AgentPipeline<TInput, TOutput> {
        this.stages.push(stage);
        return this;
    }

    /**
     * Add middleware to the pipeline
     */
    use(middleware: PipelineMiddleware): AgentPipeline<TInput, TOutput> {
        this.middleware.push(middleware);
        return this;
    }

    /**
     * Execute the pipeline
     */
    async execute(initialInput: TInput): Promise<PipelineResult<TOutput>> {
        const startTime = Date.now();
        const stageResults: PipelineResult<TOutput>['stages'] = [];
        
        let currentData: any = initialInput;
        let pipelineError: Error | undefined;

        for (const stage of this.stages) {
            const stageStartTime = Date.now();
            let executed = false;
            let skipped = false;
            let stageError: string | undefined;

            try {
                if (stage.condition && !stage.condition(currentData)) {
                    skipped = true;
                    console.log(`⏭️  Skipping stage: ${stage.name}`);
                    stageResults.push({
                        name: stage.name,
                        executed: false,
                        skipped: true,
                        duration: Date.now() - stageStartTime,
                    });
                    continue;
                }

                await this.runMiddleware('before', stage.name, currentData);

                console.log(`▶️  Executing stage: ${stage.name}`);
                
                if (stage.timeout) {
                    currentData = await this.executeWithTimeout(
                        () => stage.execute(currentData),
                        stage.timeout
                    );
                } else {
                    currentData = await stage.execute(currentData);
                }
                
                executed = true;

                await this.runMiddleware('after', stage.name, currentData);

                stageResults.push({
                    name: stage.name,
                    executed: true,
                    skipped: false,
                    duration: Date.now() - stageStartTime,
                });

            } catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                stageError = err.message;
                pipelineError = err;

                await this.runMiddleware('onError', stage.name, err);

                stageResults.push({
                    name: stage.name,
                    executed,
                    skipped,
                    duration: Date.now() - stageStartTime,
                    error: stageError,
                });

                break;
            }
        }

        const totalDuration = Date.now() - startTime;

        if (pipelineError) {
            return {
                success: false,
                error: pipelineError,
                stages: stageResults,
                totalDuration,
            };
        }

        return {
            success: true,
            data: currentData,
            stages: stageResults,
            totalDuration,
        };
    }

    /**
     * Execute stages in parallel
     */
    async executeParallel(
        input: TInput,
        stageNames?: string[]
    ): Promise<Array<{ stage: string; result: any; error?: Error }>> {
        const stagesToRun = stageNames
            ? this.stages.filter(s => stageNames.includes(s.name))
            : this.stages;

        const results = await Promise.allSettled(
            stagesToRun.map(async stage => {
                try {
                    if (stage.condition && !stage.condition(input)) {
                        return { stage: stage.name, result: null, skipped: true };
                    }

                    const result = await stage.execute(input);
                    return { stage: stage.name, result };
                } catch (error) {
                    return {
                        stage: stage.name,
                        result: null,
                        error: error instanceof Error ? error : new Error(String(error)),
                    };
                }
            })
        );

        return results.map((r, i) => {
            if (r.status === 'fulfilled') {
                return r.value;
            } else {
                return {
                    stage: stagesToRun[i].name,
                    result: null,
                    error: r.reason,
                };
            }
        });
    }

    /**
     * Clear all stages and middleware
     */
    clear(): void {
        this.stages = [];
        this.middleware = [];
    }

    /**
     * Get stage names
     */
    getStages(): string[] {
        return this.stages.map(s => s.name);
    }

    /**
     * Execute function with timeout
     */
    private async executeWithTimeout<T>(
        fn: () => Promise<T>,
        timeoutMs: number
    ): Promise<T> {
        return Promise.race([
            fn(),
            new Promise<T>((_, reject) =>
                setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
            ),
        ]);
    }

    /**
     * Run middleware hooks
     */
    private async runMiddleware(
        hook: keyof PipelineMiddleware,
        stageName: string,
        data: any
    ): Promise<void> {
        for (const mw of this.middleware) {
            const fn = mw[hook];
            if (fn) {
                await fn(stageName, data);
            }
        }
    }
}

/**
 * Create a new pipeline
 */
export function createPipeline<TInput = any, TOutput = any>(): AgentPipeline<TInput, TOutput> {
    return new AgentPipeline<TInput, TOutput>();
}

/**
 * Logging middleware
 */
export const loggingMiddleware: PipelineMiddleware = {
    before: (stageName, input) => {
        console.log(`[Pipeline] Starting stage: ${stageName}`);
    },
    after: (stageName, output) => {
        console.log(`[Pipeline] Completed stage: ${stageName}`);
    },
    onError: (stageName, error) => {
        console.error(`[Pipeline] Error in stage ${stageName}:`, error.message);
    },
};

/**
 * Timing middleware
 */
export function createTimingMiddleware() {
    const timings = new Map<string, number>();
    
    return {
        middleware: {
            before: (stageName: string) => {
                timings.set(stageName, Date.now());
            },
            after: (stageName: string) => {
                const start = timings.get(stageName);
                if (start) {
                    const duration = Date.now() - start;
                    console.log(`[Timing] ${stageName}: ${duration}ms`);
                }
            },
        },
        getTimings: () => timings,
    };
}
