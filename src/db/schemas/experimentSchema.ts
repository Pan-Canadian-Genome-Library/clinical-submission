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

import { bigint, pgEnum, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { pcglSchema } from './generate.js';

export const experimentType = pgEnum('experiment_type', [
	'NCIT:C84343 (Genomics)',
	'NCIT:C153189 (Transcriptomics)',
	'NCIT:C20085 (Proteomics)',
	'NCIT:C153191 (Metagenomics)',
	'NCIT:C153190 (Epigenomics)',
]);

export const platform = pgEnum('platform', [
	'NCIT:C84343 (Genomics)',
	'CAPILLARY',
	'DNBSEQ',
	'ELEMENT',
	'HELICOS',
	'ILLUMINA',
	'IONTORRENT',
	'LS454',
	'ONT',
	'PACBIO',
	'SINGULAR',
	'SOLID',
	'ULTIMA',
]);

export const experiment = pcglSchema.table('experiment', {
	id: bigint({ mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
	submitter_experiment_id: varchar({ length: 255 }).notNull(),
	submitter_sample_id: varchar({ length: 255 }).notNull(),
	experiment_type: experimentType().notNull(),
	experiment_design: varchar({ length: 255 }),
	assay_type_code: varchar({ length: 255 }).notNull(),
	assay_type_term: varchar({ length: 255 }),
	platform: platform().notNull(),
	instrument: varchar({ length: 255 }).notNull(),
	instrument_metadata: text(),
	sequencing_protocol: text(),
	created_at: timestamp().notNull().defaultNow(),
	updated_at: timestamp(),
});
