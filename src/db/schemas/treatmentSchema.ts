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

export const treatmentTypeEnum = pgEnum('treatment_type', ['Medication', 'Procedure', 'Radiation therapy', 'Other']);

export const treatmentIntentEnum = pgEnum('treatment_intent', [
	'Curative',
	'Diagnostic',
	'Forensic',
	'Guidance',
	'Palliative',
	'Preventative',
	'Screening',
	'Supportive',
	'Other',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
	'Missing - Unknown',
	'Not applicable',
]);

export const treatmentResponseEnum = pgEnum('treatment_response', [
	'Clinical remission',
	'Disease Progression',
	'Improvement of symptoms',
	'No improvement of symptoms',
	'No sign of disease',
	'Partial Response',
	'Stable Disease',
	'Treatment cessation due to toxicity',
	'Worsening of symptoms',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
	'Missing - Unknown',
	'Not applicable',
]);

export const treatmentStatusEnum = pgEnum('treatment_status', [
	'Other',
	'Patient choice (stopped or interrupted treatment)',
	'Physician decision (stopped or interrupted treatment)',
	'Treatment completed as prescribed',
	'Treatment incomplete due to technical problems',
	'Treatment incomplete because patient died',
	'Treatment ongoing',
	'Treatment stopped due to lack of efficacy',
	'Treatment stopped due to acute toxicity',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
	'Missing - Unknown',
	'Not applicable',
]);

export const treatment = pcglSchema.table('treatment', {
	id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	submitter_participant_id: varchar({ length: 255 }).notNull(),
	submitter_treatment_id: varchar({ length: 255 }).notNull(),
	treatment_type: treatmentTypeEnum().notNull(),
	submitter_diagnosis_id: varchar({ length: 255 }),
	age_at_treatment: integer(),
	treatment_duration: integer(),
	treatment_intent: treatmentIntentEnum(),
	treatment_response: treatmentResponseEnum(),
	treatment_status: treatmentStatusEnum(),
	created_at: timestamp().notNull().defaultNow(),
	updated_at: timestamp(),
});
