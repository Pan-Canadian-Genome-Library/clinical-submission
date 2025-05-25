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

import { bigint, pgEnum, timestamp, varchar } from 'drizzle-orm/pg-core';

import { pcglSchema } from './generate.js';

// NOTE: I am unsure if this needs to be enums or should be just free strings fields

export const raceEnum = pgEnum('race', [
	'Black',
	'East Asian',
	'Indigenous (First Nations, Inuk/Inuit, Métis)',
	'Latin American',
	'Middle Eastern or North African',
	'South Asian',
	'Southeast Asian',
	'White',
	'Another Racial Category',
	'Do not know',
	'Prefer not to answer',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const raceCollectMethodEnum = pgEnum('race_collect', [
	'Socially assigned',
	'Self-identified',
	'Derived',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const genderEnum = pgEnum('gender', [
	'Man',
	'Woman',
	'Another Gender',
	'Prefer not to answer',
	'Not applicable',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const genderCollectMethodEnum = pgEnum('gender_collect', [
	'Self-identified',
	'Other',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const ethnicityEnum = pgEnum('ethnicity', [
	'Free text input',
	'Another Ethnic or Cultural Origin',
	'Do not know',
	'Prefer not to answer',
	'Not applicable',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const ethnicityCollectMethodEnum = pgEnum('ethnicity_collect', [
	'Socially assigned',
	'Self-identified',
	'Derived',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const sexEnum = pgEnum('sex', [
	'Male',
	'Female',
	'Intersex',
	'Another Sex',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const sexCollectMethodEnum = pgEnum('sex_collect', [
	'Self-identified',
	'Clinician-recorded',
	'Derived',
	'Other',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const educationEnum = pgEnum('eduction', [
	'No formal education',
	'Elementary school or equivalent',
	'High school diploma or equivalency certificate',
	'Certificate of Apprenticeship',
	'Certificate of Qualification',
	'College, CEGEP, or other non-university certificate or diploma',
	"Bachelor's degree",
	'Degree in medicine, dentistry, veterinary medicine or optometry',
	"Master's degree",
	'Doctoral degree',
	'Post-doctoral fellowship or training',
	'Prefer not to answer',
	'Not applicable',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const educationCollectMethodEnum = pgEnum('education_collect', [
	'Self-identified',
	'Derived',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const incomeEnum = pgEnum('income', [
	'Less than $15,000',
	'$ 15,000 - $ 19,999',
	'$ 20,000 - $ 29,000',
	'$ 30,000 - $ 49,999',
	'$ 50,000 - $ 69,999',
	'$ 70,000 - $ 84,999',
	'$ 85,000 - $ 99,999',
	'$ 100,000 - $ 124,999',
	'$ 125,000 - $ 149,999',
	'$ 150,000 or more',
	'Prefer not to answer',
	'Not applicable',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const incomeCollectEnum = pgEnum('income_collect', [
	'Self-identified',
	'Derived',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const geographicCollectEnum = pgEnum('geographic_collect', [
	'Self-identified',
	'Derived',
	'Missing - Unknown',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
]);

export const sociodemQuestion = pgEnum('sociodem', [
	'PCGL reference question',
	'Another question',
	'Missing - Not collected',
	'Missing - Not provided',
	'Missing - Restricted access',
	'Missing - Unknown',
]);

export const sociodemographic = pcglSchema.table('sociodemographic', {
	id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	submitter_sociodem_id: varchar({ length: 255 }).notNull(),
	submitter_participant_id: varchar({ length: 255 }).notNull(),
	age_at_sociodem_collection: bigint({ mode: 'number' }).notNull(),
	sociodem_date_collection: timestamp().notNull().defaultNow(),
	race: raceEnum().notNull(),
	race_another_racial_category: varchar({ length: 255 }).notNull(),
	race_collect_method: raceCollectMethodEnum(),
	gender: genderEnum().notNull(),
	gender_another_gender: varchar({ length: 255 }),
	gender_collect_method: genderCollectMethodEnum().notNull(),
	ethnicity: ethnicityEnum().notNull(),
	ethnicity_another_category: varchar({ length: 255 }),
	ethnicity_collect_method: ethnicityCollectMethodEnum().notNull(),
	sex_at_birth: sexEnum().notNull(),
	sex_another_category: varchar({ length: 255 }),
	sex_collect_method: sexCollectMethodEnum().notNull(),
	education: educationEnum().notNull(),
	education_collect_method: educationCollectMethodEnum().notNull(),
	personal_income: incomeEnum().notNull(),
	personal_income_collect_method: incomeCollectEnum().notNull(),
	geographic_location: varchar({ length: 255 }).notNull(),
	geographic_location_additional: varchar({ length: 255 }),
	geographic_location_collect_method: geographicCollectEnum().notNull(),
	sociodem_question: sociodemQuestion().notNull(),
	sociodem_question_detail: varchar({ length: 255 }),
	sociodem_notes: varchar({ length: 255 }),
});
