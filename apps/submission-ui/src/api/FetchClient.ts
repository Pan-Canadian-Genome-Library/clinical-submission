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

import { ServerError } from '@/types/server';

/**
 * Custom error class for fetch errors, modeled after ServerError interface
 */
export class FetchError extends Error implements ServerError {
	message: string;
	error: string;
	status: number;

	constructor(error: string, status: number, message?: string) {
		super(message || error);
		this.message = message || '';
		this.error = error;
		this.status = status;
	}
}

/**
 * A wrapper for `fetch`, used to append the application API URL to all fetch calls.
 * @param resource This defines the resource that you wish to fetch. This can be a string or a `URL` object — that provides the URL of the resource you want to fetch. Important - prepend your request URLs with `/`
 * @param options A `RequestInit` object containing any custom settings that you want to apply to the request.
 * @returns A promise containing a `Response` object.
 * @throws {FetchError} When response has error status code or network error occurs
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch
 */
async function fetchClient(resource: string | URL, options?: RequestInit): Promise<Response> {
	// __API_PROXY_PATH__ is declared in the vite.config.ts so that we are sure to be using the same
	// path here as is used by the server proxy.
	const applicationAPIPrefix = __API_PROXY_PATH__;
	const headers = new Headers({ 'Content-Type': 'application/json' });

	if (typeof resource === 'string') {
		resource = applicationAPIPrefix + resource;
	} else if (resource instanceof URL) {
		resource.hostname = applicationAPIPrefix;
	}

	try {
		const response = await fetch(resource, { headers: headers, ...options });

		// Check if server response is ok
		if (!response.ok) {
			const errorBody = await response.json();
			throw new FetchError(errorBody.error || response.statusText, response.status, errorBody.message || '');
		}

		return response;
	} catch (error) {
		// Error response returned from the server
		if (error instanceof FetchError) {
			throw error;
		}

		// Network errors and response.json() error handloing
		if (error instanceof Error) {
			throw new FetchError(`Network error`, 500, error.message);
		}

		// Default to system error
		throw new FetchError('System Error', 500, 'An unknown error occurred during fetch');
	}
}

export { fetchClient as fetch };
