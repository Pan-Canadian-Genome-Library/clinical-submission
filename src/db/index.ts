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

import { drizzle } from 'drizzle-orm/node-postgres';

import { setStatus, Status } from '@/app-health.js';
import { logger } from '@/common/logger.js';

import * as schema from './schemas/index.js';

export type PostgresDb = ReturnType<typeof drizzle<typeof schema>>;

let pgDatabase: PostgresDb;

export const getDbInstance = (): PostgresDb => {
	if (!pgDatabase) {
		throw new Error('Not connected to Postgres database');
	}

	return pgDatabase;
};

export const connectToDb = (connectionString: string): PostgresDb => {
	try {
		const db = drizzle<typeof schema>(connectionString);
		pgDatabase = db;

		setStatus('db', { status: Status.OK });
		return db;
	} catch (err) {
		logger.error('Error on Database startup: \n', err);

		if (err instanceof Error) {
			setStatus('db', { status: Status.ERROR, info: { err: err.message } });
		} else {
			setStatus('db', { status: Status.ERROR, info: { err: String(err) } });
		}
		throw err;
	}
};
