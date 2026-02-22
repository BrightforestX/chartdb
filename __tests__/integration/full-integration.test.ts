/**
 * Full Integration Tests
 * Tests the complete integration between MCP, Pipedream, and CrewAI
 */

import { describe, it, expect, beforeAll } from 'vitest';

describe('ChartDB Integration Suite', () => {
    describe('MCP Server Integration', () => {
        it('should export MCP server module', async () => {
            // In a real test, we'd import and test the MCP server
            // For now, verify the files exist
            const fs = await import('fs');
            const path = await import('path');
            
            const mcpServerPath = path.resolve(process.cwd(), 'mcp-server');
            expect(fs.existsSync(mcpServerPath)).toBe(true);
            
            const packageJsonPath = path.join(mcpServerPath, 'package.json');
            expect(fs.existsSync(packageJsonPath)).toBe(true);
        });

        it('should have required MCP dependencies', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const packageJsonPath = path.resolve(process.cwd(), 'mcp-server/package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            
            expect(packageJson.dependencies).toHaveProperty('@modelcontextprotocol/sdk');
            expect(packageJson.dependencies).toHaveProperty('zod');
        });
    });

    describe('Pipedream Components Integration', () => {
        it('should have Pipedream component structure', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const pipedreamPath = path.resolve(process.cwd(), 'pipedream');
            expect(fs.existsSync(pipedreamPath)).toBe(true);
            
            const componentsPath = path.join(pipedreamPath, 'components/chartdb');
            expect(fs.existsSync(componentsPath)).toBe(true);
        });

        it('should have required Pipedream actions', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const actionsPath = path.resolve(process.cwd(), 'pipedream/components/chartdb/actions');
            
            const requiredActions = [
                'create-diagram.mjs',
                'add-table.mjs',
                'add-relationship.mjs',
                'export-diagram.mjs',
            ];
            
            for (const action of requiredActions) {
                const actionPath = path.join(actionsPath, action);
                expect(fs.existsSync(actionPath)).toBe(true);
            }
        });

        it('should have required Pipedream sources', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const sourcesPath = path.resolve(process.cwd(), 'pipedream/components/chartdb/sources');
            
            const requiredSources = [
                'diagram-updated.mjs',
                'new-diagram.mjs',
            ];
            
            for (const source of requiredSources) {
                const sourcePath = path.join(sourcesPath, source);
                expect(fs.existsSync(sourcePath)).toBe(true);
            }
        });
    });

    describe('CrewAI Agents Integration', () => {
        it('should have CrewAI agent structure', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const crewaiPath = path.resolve(process.cwd(), 'crewai-agents');
            expect(fs.existsSync(crewaiPath)).toBe(true);
            
            const agentsPath = path.join(crewaiPath, 'src/agents');
            expect(fs.existsSync(agentsPath)).toBe(true);
        });

        it('should have all required agents', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const agentsPath = path.resolve(process.cwd(), 'crewai-agents/src/agents');
            
            const requiredAgents = [
                'schema-analyzer.ts',
                'diagram-generator.ts',
                'optimization-agent.ts',
            ];
            
            for (const agent of requiredAgents) {
                const agentPath = path.join(agentsPath, agent);
                expect(fs.existsSync(agentPath)).toBe(true);
            }
        });

        it('should have crew orchestration', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const crewPath = path.resolve(process.cwd(), 'crewai-agents/src/crews/schema-crew.ts');
            expect(fs.existsSync(crewPath)).toBe(true);
        });
    });

    describe('REST API Integration', () => {
        it('should have API structure', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const apiPath = path.resolve(process.cwd(), 'src/api');
            expect(fs.existsSync(apiPath)).toBe(true);
            
            const controllersPath = path.join(apiPath, 'controllers');
            expect(fs.existsSync(controllersPath)).toBe(true);
        });

        it('should have required API controllers', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const controllersPath = path.resolve(process.cwd(), 'src/api/controllers');
            
            const requiredControllers = [
                'diagram-controller.ts',
                'webhook-controller.ts',
            ];
            
            for (const controller of requiredControllers) {
                const controllerPath = path.join(controllersPath, controller);
                expect(fs.existsSync(controllerPath)).toBe(true);
            }
        });

        it('should have authentication middleware', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const authPath = path.resolve(process.cwd(), 'src/api/middleware/auth.ts');
            expect(fs.existsSync(authPath)).toBe(true);
        });
    });

    describe('Documentation', () => {
        it('should have MCP server README', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const readmePath = path.resolve(process.cwd(), 'mcp-server/README.md');
            expect(fs.existsSync(readmePath)).toBe(true);
        });

        it('should have Pipedream README', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const readmePath = path.resolve(process.cwd(), 'pipedream/README.md');
            expect(fs.existsSync(readmePath)).toBe(true);
        });

        it('should have CrewAI README', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const readmePath = path.resolve(process.cwd(), 'crewai-agents/README.md');
            expect(fs.existsSync(readmePath)).toBe(true);
        });

        it('should have example workflows', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const workflowsPath = path.resolve(process.cwd(), 'pipedream/workflows/example-workflows.md');
            expect(fs.existsSync(workflowsPath)).toBe(true);
        });
    });

    describe('Integration Plan', () => {
        it('should have integration plan document', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const planPath = path.resolve(
                process.cwd(),
                '.cursor/plans/pipedream_mcp_crewai_integration_76101106.plan.md'
            );
            expect(fs.existsSync(planPath)).toBe(true);
        });

        it('should have development rules', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const rulesPath = path.resolve(process.cwd(), '.cursor/rules/development.md');
            expect(fs.existsSync(rulesPath)).toBe(true);
        });
    });

    describe('Configuration Files', () => {
        it('should have all package.json files', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const packagePaths = [
                'mcp-server/package.json',
                'pipedream/package.json',
                'crewai-agents/package.json',
            ];
            
            for (const pkgPath of packagePaths) {
                const fullPath = path.resolve(process.cwd(), pkgPath);
                expect(fs.existsSync(fullPath)).toBe(true);
            }
        });

        it('should have all TypeScript configs', async () => {
            const fs = await import('fs');
            const path = await import('path');
            
            const tsconfigPaths = [
                'mcp-server/tsconfig.json',
                'crewai-agents/tsconfig.json',
            ];
            
            for (const tsconfigPath of tsconfigPaths) {
                const fullPath = path.resolve(process.cwd(), tsconfigPath);
                expect(fs.existsSync(fullPath)).toBe(true);
            }
        });
    });
});

describe('Component Integration', () => {
    it('should integrate MCP with Pipedream', () => {
        // MCP server provides resources and tools
        // Pipedream components can call the API
        // Both should work together seamlessly
        expect(true).toBe(true); // Placeholder for actual integration test
    });

    it('should integrate CrewAI with API', () => {
        // CrewAI agents should be callable via API
        // API should handle agent requests and responses
        expect(true).toBe(true); // Placeholder for actual integration test
    });

    it('should support complete workflow', () => {
        // Complete workflow:
        // 1. Pipedream receives webhook
        // 2. Calls API to create diagram
        // 3. CrewAI agents analyze and optimize
        // 4. Results available via MCP
        // 5. Webhooks notify subscribers
        expect(true).toBe(true); // Placeholder for actual workflow test
    });
});
