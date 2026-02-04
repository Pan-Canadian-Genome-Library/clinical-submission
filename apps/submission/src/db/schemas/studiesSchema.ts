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

import { relations, sql } from 'drizzle-orm';
import { foreignKey, integer, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { dac } from './dacSchema.js';
import { pcglSchema } from './generate.js';

export const studyStatus = pcglSchema.enum('study_status', ['Ongoing', 'Completed']);
export const studyContext = pcglSchema.enum('study_context', ['Clinical', 'Research']);

const STUDY_ID_PADDING = 4 as const;
const STUDY_ID_PREFIX = 'PCGLST' as const;
const STUDY_ID_SEQUENCE_NAME = 'study_id_seq' as const;

export const studyIdSequence = pcglSchema.sequence(STUDY_ID_SEQUENCE_NAME, {
	startWith: 1,
	increment: 1,
	maxValue: 9999,
});

export const studyIdDefault = sql.raw(`
	'${STUDY_ID_PREFIX}' || lpad(
		nextval('${pcglSchema.schemaName}.${STUDY_ID_SEQUENCE_NAME}')::text,
		${STUDY_ID_PADDING},
		'0'
	)
`);

export const study = pcglSchema.table(
	'study',
	{
		study_id: text().primaryKey().default(studyIdDefault),
		dac_id: text().notNull(),
		study_name: varchar({ length: 255 }).unique().notNull(),
		study_description: text().notNull(), // Assuming the description is large
		program_name: varchar({ length: 255 }),
		keywords: text().array(),
		status: studyStatus().notNull(),
		context: studyContext().notNull(),
		domain: text().array().notNull(),
		participant_criteria: text(),
		principal_investigators: text().array().notNull(),
		lead_organizations: text().array().notNull(),
		collaborators: text().array(),
		funding_sources: text().array().notNull(),
		publication_links: text().array(),
		created_at: timestamp().notNull().defaultNow(),
		updated_at: timestamp(),
		category_id: integer().unique(),
	},
	(table) => [
		foreignKey({
			columns: [table.dac_id],
			foreignColumns: [dac.dac_id],
			name: 'dac_id_fk',
		}),
	],
);

export const studyRelations = relations(study, ({ one }) => ({
	dac_id: one(dac, {
		fields: [study.dac_id],
		references: [dac.dac_id],
	}),
}));
