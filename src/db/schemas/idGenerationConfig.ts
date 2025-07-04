import { relations } from 'drizzle-orm';
import { integer, serial, text, timestamp, unique, varchar } from 'drizzle-orm/pg-core';

import { pcglSchema } from './generate.js';

export const idGenerationConfig = pcglSchema.table(
	'id_generation_config',
	{
		id: serial('id').primaryKey(),
		entityName: varchar('entity_name', { length: 255 }).notNull(),
		fieldName: varchar('field_name', { length: 255 }).notNull(),
		prefix: varchar('prefix', { length: 50 }).notNull(),
		paddingLength: integer('padding_length').notNull(),
		sequenceName: varchar('sequence_name', { length: 255 }).notNull().unique(),
		sequenceStart: integer('sequence_start').notNull(),
		createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
	},
	(table) => [unique().on(table.entityName, table.fieldName)],
);

export const generatedIdentifiers = pcglSchema.table('generated_identifiers', {
	id: serial('id').primaryKey(),
	sourceHash: text('source_hash').notNull().unique(),
	generatedId: varchar('generated_id', { length: 255 }).notNull(),
	configId: integer('config_id').references(() => idGenerationConfig.id),
	createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});

export const idGenerationConfigRelations = relations(idGenerationConfig, ({ many }) => ({
	generatedIds: many(generatedIdentifiers),
}));

export const generatedIdentifiersRelations = relations(generatedIdentifiers, ({ one }) => ({
	config: one(idGenerationConfig, {
		fields: [generatedIdentifiers.configId],
		references: [idGenerationConfig.id],
	}),
}));
