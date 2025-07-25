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

/**
 * Currently Drizzle does not type errors which means it makes it harder for us to check for what error
 * we've encountered after one has been thrown. This is planned to be added in the future in Drizzle, and
 * when it is, use of this check should be updated and use of this function should be deprecated.
 *
 * Postgres errors always have "severity" and "code" and "table" in them so we can validate this way.
 *
 * @see https://github.com/drizzle-team/drizzle-orm/issues/376
 * @param error - The error object.
 * @returns A `{code: string, severity: string}` if it is, `undefined` if not.
 */
export const isPostgresError = (
	error: unknown,
): (Error & { code: string | unknown; severity: string | unknown; constraint?: string | unknown }) | undefined => {
	if (
		error &&
		typeof error === 'object' &&
		error instanceof Error &&
		'severity' in error &&
		'code' in error &&
		('table' in error || 'constraint' in error)
	) {
		return error;
	}
	return undefined;
};

/**
 * More errors for this can be added in the future,
 * however currently we only really care about unique key violations.
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PostgresErrors = {
	UNIQUE_KEY_VIOLATION: '23505',
	FOREIGN_KEY_VIOLATION: '23503',
	IN_FAILED_SQL_TRANSACTION: '25P02',
} as const;

type PostgresErrors = (typeof PostgresErrors)[keyof typeof PostgresErrors];
