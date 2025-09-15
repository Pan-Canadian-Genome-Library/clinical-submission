/*
 * Copyright (c) 2025 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import { relations } from 'drizzle-orm';
import { integer, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { pcglSchema } from './generate.js';

export const idGenerationConfig = pcglSchema.table('id_generation_config', {
	id: serial('id').primaryKey(),
	entityName: varchar('entity_name', { length: 255 }).notNull().unique(),
	fieldName: varchar('field_name', { length: 255 }).notNull(),
	prefix: varchar('prefix', { length: 50 }).notNull(),
	internalId: varchar('internal_id', { length: 50 }).notNull().unique(),
	paddingLength: integer('padding_length').notNull(),
	sequenceName: varchar('sequence_name', { length: 255 }).notNull().unique(),
	sequenceStart: integer('sequence_start').notNull(),
	createdAt: timestamp('created_at', { withTimezone: false }).defaultNow(),
});

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
