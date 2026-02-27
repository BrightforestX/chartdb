/**
 * Agent Result Validation
 * Ensure agent outputs meet quality standards
 */

import type { SchemaAnalysis, OptimizationReport } from '../types.js';
import type { Diagram } from '../agents/schema-analyzer.js';

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'error';
}

export interface ValidationWarning {
    field: string;
    message: string;
    severity: 'warning';
}

export type ValidationIssue = ValidationError | ValidationWarning;

/**
 * Base validator class
 */
export abstract class Validator<T> {
    abstract validate(data: T): ValidationResult;

    protected createError(field: string, message: string): ValidationError {
        return { field, message, severity: 'error' };
    }

    protected createWarning(field: string, message: string): ValidationWarning {
        return { field, message, severity: 'warning' };
    }

    protected isValidString(value: any, minLength: number = 1): boolean {
        return typeof value === 'string' && value.trim().length >= minLength;
    }

    protected isValidNumber(value: any, min?: number, max?: number): boolean {
        if (typeof value !== 'number' || isNaN(value)) return false;
        if (min !== undefined && value < min) return false;
        if (max !== undefined && value > max) return false;
        return true;
    }

    protected isValidArray(value: any, minLength: number = 0): boolean {
        return Array.isArray(value) && value.length >= minLength;
    }
}

/**
 * Diagram validator
 */
export class DiagramValidator extends Validator<Diagram> {
    validate(diagram: Diagram): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        if (!diagram) {
            errors.push(this.createError('diagram', 'Diagram is null or undefined'));
            return { valid: false, errors, warnings };
        }

        if (!this.isValidString(diagram.id)) {
            errors.push(this.createError('diagram.id', 'Diagram ID is required'));
        }

        if (!this.isValidString(diagram.name)) {
            errors.push(this.createError('diagram.name', 'Diagram name is required'));
        }

        if (!this.isValidString(diagram.databaseType)) {
            errors.push(this.createError('diagram.databaseType', 'Database type is required'));
        }

        if (!this.isValidArray(diagram.tables)) {
            errors.push(this.createError('diagram.tables', 'Tables array is required'));
        } else {
            if (diagram.tables.length === 0) {
                warnings.push(this.createWarning('diagram.tables', 'Diagram has no tables'));
            }

            for (let i = 0; i < diagram.tables.length; i++) {
                const table = diagram.tables[i];
                
                if (!this.isValidString(table.id)) {
                    errors.push(this.createError(`diagram.tables[${i}].id`, 'Table ID is required'));
                }

                if (!this.isValidString(table.name)) {
                    errors.push(this.createError(`diagram.tables[${i}].name`, 'Table name is required'));
                }

                if (!this.isValidArray(table.fields)) {
                    errors.push(this.createError(`diagram.tables[${i}].fields`, 'Table fields array is required'));
                } else if (table.fields.length === 0) {
                    warnings.push(this.createWarning(`diagram.tables[${i}].fields`, `Table "${table.name}" has no fields`));
                }

                const hasPrimaryKey = table.fields.some(f => f.primaryKey);
                if (!hasPrimaryKey) {
                    warnings.push(this.createWarning(`diagram.tables[${i}]`, `Table "${table.name}" has no primary key`));
                }
            }
        }

        if (!this.isValidArray(diagram.relationships)) {
            errors.push(this.createError('diagram.relationships', 'Relationships array is required'));
        } else {
            for (let i = 0; i < diagram.relationships.length; i++) {
                const rel = diagram.relationships[i];
                
                if (!this.isValidString(rel.id)) {
                    errors.push(this.createError(`diagram.relationships[${i}].id`, 'Relationship ID is required'));
                }

                if (!this.isValidString(rel.sourceTableId)) {
                    errors.push(this.createError(`diagram.relationships[${i}].sourceTableId`, 'Source table ID is required'));
                }

                if (!this.isValidString(rel.targetTableId)) {
                    errors.push(this.createError(`diagram.relationships[${i}].targetTableId`, 'Target table ID is required'));
                }

                const sourceExists = diagram.tables.some(t => t.id === rel.sourceTableId);
                const targetExists = diagram.tables.some(t => t.id === rel.targetTableId);

                if (!sourceExists) {
                    errors.push(this.createError(`diagram.relationships[${i}]`, 'Source table does not exist'));
                }

                if (!targetExists) {
                    errors.push(this.createError(`diagram.relationships[${i}]`, 'Target table does not exist'));
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}

/**
 * Schema analysis validator
 */
export class SchemaAnalysisValidator extends Validator<SchemaAnalysis> {
    validate(analysis: SchemaAnalysis): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        if (!analysis) {
            errors.push(this.createError('analysis', 'Analysis is null or undefined'));
            return { valid: false, errors, warnings };
        }

        if (!this.isValidNumber(analysis.tableCount, 0)) {
            errors.push(this.createError('analysis.tableCount', 'Table count must be a non-negative number'));
        }

        if (!this.isValidNumber(analysis.relationshipCount, 0)) {
            errors.push(this.createError('analysis.relationshipCount', 'Relationship count must be a non-negative number'));
        }

        if (!this.isValidNumber(analysis.normalizationScore, 0, 100)) {
            errors.push(this.createError('analysis.normalizationScore', 'Normalization score must be between 0 and 100'));
        }

        if (!this.isValidArray(analysis.issues)) {
            errors.push(this.createError('analysis.issues', 'Issues array is required'));
        } else {
            for (let i = 0; i < analysis.issues.length; i++) {
                const issue = analysis.issues[i];
                
                if (!['error', 'warning', 'info'].includes(issue.severity)) {
                    errors.push(this.createError(`analysis.issues[${i}].severity`, 'Invalid severity level'));
                }

                if (!this.isValidString(issue.type)) {
                    errors.push(this.createError(`analysis.issues[${i}].type`, 'Issue type is required'));
                }

                if (!this.isValidString(issue.description)) {
                    errors.push(this.createError(`analysis.issues[${i}].description`, 'Issue description is required'));
                }
            }
        }

        if (!this.isValidArray(analysis.suggestions)) {
            errors.push(this.createError('analysis.suggestions', 'Suggestions array is required'));
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}

/**
 * Optimization report validator
 */
export class OptimizationReportValidator extends Validator<OptimizationReport> {
    validate(report: OptimizationReport): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        if (!report) {
            errors.push(this.createError('report', 'Optimization report is null or undefined'));
            return { valid: false, errors, warnings };
        }

        if (!this.isValidNumber(report.score, 0, 100)) {
            errors.push(this.createError('report.score', 'Optimization score must be between 0 and 100'));
        }

        if (!this.isValidArray(report.recommendations)) {
            errors.push(this.createError('report.recommendations', 'Recommendations array is required'));
        } else {
            for (let i = 0; i < report.recommendations.length; i++) {
                const rec = report.recommendations[i];
                
                if (!['high', 'medium', 'low'].includes(rec.priority)) {
                    errors.push(this.createError(`report.recommendations[${i}].priority`, 'Invalid priority level'));
                }

                if (!this.isValidString(rec.category)) {
                    errors.push(this.createError(`report.recommendations[${i}].category`, 'Recommendation category is required'));
                }

                if (!this.isValidString(rec.description)) {
                    errors.push(this.createError(`report.recommendations[${i}].description`, 'Recommendation description is required'));
                }
            }
        }

        if (!['unknown', 'low', 'medium', 'high'].includes(report.estimatedImpact)) {
            errors.push(this.createError('report.estimatedImpact', 'Invalid estimated impact value'));
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings,
        };
    }
}

/**
 * Composite validator that runs multiple validators
 */
export class CompositeValidator {
    private validators: Array<{ name: string; validator: Validator<any> }> = [];

    add<T>(name: string, validator: Validator<T>): this {
        this.validators.push({ name, validator });
        return this;
    }

    validate(data: Record<string, any>): ValidationResult {
        const allErrors: ValidationError[] = [];
        const allWarnings: ValidationWarning[] = [];

        for (const { name, validator } of this.validators) {
            const value = data[name];
            if (value === undefined || value === null) {
                allWarnings.push({
                    field: name,
                    message: `${name} is missing`,
                    severity: 'warning',
                });
                continue;
            }

            const result = validator.validate(value);
            allErrors.push(...result.errors);
            allWarnings.push(...result.warnings);
        }

        return {
            valid: allErrors.length === 0,
            errors: allErrors,
            warnings: allWarnings,
        };
    }
}

/**
 * Validate agent result with automatic type detection
 */
export function validateAgentResult(result: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!result) {
        errors.push({ field: 'result', message: 'Result is null or undefined', severity: 'error' });
        return { valid: false, errors, warnings };
    }

    if (typeof result.success !== 'boolean') {
        errors.push({ field: 'result.success', message: 'Success flag must be a boolean', severity: 'error' });
    }

    if (result.success === false && !result.error) {
        warnings.push({ field: 'result.error', message: 'Failed result should include error message', severity: 'warning' });
    }

    if (result.success === true && !result.data) {
        warnings.push({ field: 'result.data', message: 'Successful result should include data', severity: 'warning' });
    }

    if (result.metadata) {
        if (!Array.isArray(result.metadata.agentsUsed)) {
            warnings.push({ field: 'result.metadata.agentsUsed', message: 'Agents used should be an array', severity: 'warning' });
        }

        if (typeof result.metadata.timestamp !== 'string') {
            warnings.push({ field: 'result.metadata.timestamp', message: 'Timestamp should be a string', severity: 'warning' });
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Create validator instances
 */
export const validators = {
    diagram: new DiagramValidator(),
    analysis: new SchemaAnalysisValidator(),
    optimization: new OptimizationReportValidator(),
};
