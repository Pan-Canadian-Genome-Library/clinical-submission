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

import { useQuery } from '@tanstack/react-query';

import { fetch } from '@/api/FetchClient';
import { ServerError } from '@/types/server';
import { userStudies } from '@clinical-submission/validation';

/**
 * Query hook to fetch the current user's studies from Submission API.
 */
const useGetUserStudies = () => {
	return useQuery<string[], ServerError>({
		queryKey: ['userStudies'],
		retry: 1,
		queryFn: async () => {
			const response = await fetch(`/user/studies`);

			if (!response.ok) {
				console.debug(`[useGetUserStudies]: Error fetching /user/studies', response status ${response.status}`);
				return [];
			}

			try {
				const result = await response.json();

				// Validate user object
				const userParseResult = userStudies.safeParse(result);
				if (!userParseResult.success) {
					//TODO: This should throw an alert if the response object returned from the api is successful but does not pass zod validation.
					console.debug('[useGetUserStudies]: Response from user endpoint failed validation', userParseResult.error);
					return [];
				}
				return userParseResult.data.userStudies;
			} catch (error) {
				console.debug('[useGetUserStudies]: Failed to parse response object', error);
				return [];
			}
		},
	});
};

export default useGetUserStudies;
