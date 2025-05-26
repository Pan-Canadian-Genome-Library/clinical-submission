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

import { bigint, integer, pgEnum, timestamp, varchar } from 'drizzle-orm/pg-core';

import { pcglSchema } from './generate.js';

export const specimenStorage = pgEnum('specimen_storage', [
	'Cut slide',
	'Frozen in -70 freezer',
	'Frozen in liquid nitrogen',
	'Frozen in vapour phase',
	'Not Applicable',
	'Other',
	'Paraffin block',
	'RNA later frozen',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
	'Missing - Unknown',
	'Not applicable',
]);

export const specimenProcessing = pgEnum('specimen_processing', [
	'Cryopreservation in liquid nitrogen (dead tissue)',
	'Cryopreservation in dry ice (dead tissue)',
	'Cryopreservation of live cells in liquid nitrogen',
	'Cryopreservation - other',
	'Formalin fixed & paraffin embedded',
	'Formalin fixed - buffered',
	'Formalin fixed - unbuffered',
	'Fresh',
	'Other',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
	'Missing - Unknown',
]);

export const specimenLaterality = pgEnum('specimen_laterality', [
	'Left',
	'Not applicable',
	'Right',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
	'Missing - Unknown',
]);

export const specimen = pcglSchema.table('specimen', {
	id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	submitter_participant_id: varchar({ length: 255 }).notNull(),
	submitter_specimen_id: varchar({ length: 255 }).notNull(),
	specimen_tissue_source_code: varchar({ length: 255 }).notNull(),
	specimen_tissue_source_term: varchar({ length: 255 }),
	specimen_storage: specimenStorage(),
	specimen_processing: specimenProcessing(),
	age_at_specimen_collection: integer(),
	specimen_anatomic_location_code: varchar({ length: 255 }),
	specimen_anatomic_location_term: varchar({ length: 255 }),
	specimen_laterality: specimenLaterality(),
	created_at: timestamp().notNull().defaultNow(),
	updated_at: timestamp(),
});
