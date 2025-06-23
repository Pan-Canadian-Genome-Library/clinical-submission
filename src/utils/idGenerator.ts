import crypto from 'crypto';

export type EntityConfig = {
	entityName: string;
	fieldName: string;
	prefix: string;
	paddingLength?: number;
	parentEntityName?: string;
	parentFieldName?: string;
};

const DEFAULT_PADDING = 8;

function parseConfig(): EntityConfig[] {
	const config = process.env.ID_MANAGER_CONFIG;

	if (!config) {
		throw new Error('Missing required environment variable: ID_MANAGER_CONFIG');
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(config);
	} catch {
		throw new Error('Invalid JSON format in ID_MANAGER_CONFIG');
	}

	if (!Array.isArray(parsed)) {
		throw new Error('ID_MANAGER_CONFIG must be an array');
	}

	return parsed.map((entry) => {
		if (
			typeof entry.entityName !== 'string' ||
			typeof entry.fieldName !== 'string' ||
			typeof entry.prefix !== 'string'
		) {
			throw new Error('Each ID_MANAGER_CONFIG entry must include entityName, fieldName, and prefix as strings');
		}

		return {
			...entry,
			paddingLength: entry.paddingLength ?? DEFAULT_PADDING,
		};
	});
}

function getSecret(): string {
	const secret = process.env.ID_MANAGER_SECRET;
	if (!secret) {
		throw new Error('Missing required environment variable: ID_MANAGER_SECRET');
	}
	return secret;
}

function hashValue(input: string, secret: string): string {
	return crypto.createHmac('sha256', secret).update(input).digest('hex').substring(0, 8);
}

const counters: Record<string, number> = {};

export function generateId(params: { entity: string; parentId?: string }): string {
	const configs = parseConfig();
	const config = configs.find((c) => c.entityName === params.entity);

	if (!config) {
		throw new Error(`No ID configuration found for entity: ${params.entity}`);
	}

	const counter = (counters[params.entity] = (counters[params.entity] || 0) + 1);
	const padded = counter.toString().padStart(config.paddingLength ?? DEFAULT_PADDING, '0');

	const rawInput = `${params.entity}-${params.parentId ?? ''}-${counter}-${Date.now()}`;
	const secret = getSecret();
	const hash = hashValue(rawInput, secret);

	return `${config.prefix}${padded}-${hash}`;
}
