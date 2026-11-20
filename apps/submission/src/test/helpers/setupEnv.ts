/*
 * Copyright (c) 2026 The Ontario Institute for Cancer Research. All rights reserved
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
 * Environment for the endpoint tests. Import this before anything else in a test file: the config
 * modules parse `process.env` once, when they are first imported.
 *
 * All values are placeholders, no external service is ever contacted. `AUTH_PROTECT_METHODS`
 * deliberately leaves GET out so that the tests catch any endpoint that relies on Lyric's own
 * auth middleware, which skips unprotected methods.
 */
Object.assign(process.env, {
	NODE_ENV: 'development',
	LOG_LEVEL: 'error',
	API_HOST: 'http://localhost:3030',
	UI_HOST: 'http://localhost:3000',
	DB_HOST: '127.0.0.1',
	DB_NAME: 'test',
	DB_PASSWORD: 'test',
	DB_PORT: '5999',
	DB_USER: 'test',
	LECTERN_URL: 'http://localhost:3001',
	ID_MANAGER_SECRET: 'test-id-manager-secret',
	ID_MANAGER_CONFIG: JSON.stringify([
		{
			entityName: 'participant',
			fieldName: 'submitter_participant_id',
			prefix: 'PT',
			internalId: 'pcgl_participant_id',
		},
	]),
	AUTH_ENABLED: 'true',
	AUTH_PROTECT_METHODS: 'POST,PUT,DELETE',
	AUTHZ_ENDPOINT: 'http://authz.test',
	AUTH_PROVIDER_HOST: 'http://auth-provider.test',
	AUTH_CLIENT_ID: 'test-client-id',
	AUTH_CLIENT_SECRET: 'test-client-secret',
	AUTHZ_SERVICE_ID: 'test-service',
	AUTHZ_SERVICE_UUID: '00000000-0000-0000-0000-000000000000',
});
