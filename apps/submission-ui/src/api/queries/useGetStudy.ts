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
import { StudyResponse } from '@clinical-submission/data-model';

/**
 * Query hook to fetch the current user from the auth-session endpoint.
 */
const useGetStudy = ({ studyId }: { studyId: string }) => {
	return useQuery<StudyResponse, ServerError>({
		queryKey: ['study', studyId],
		retry: 1,
		queryFn: async () => {
			const response = await fetch(`/study/${studyId}`);

			if (!response.ok) {
				console.debug(`[useGetStudy]: Error fetching /study/${studyId}', response status ${response.status}`);
				throw new Error(`Failed to fetch study ${studyId}: ${response.statusText}`);
			}

			try {
				const result = await response.json();

				return result;
			} catch (error) {
				console.debug('[useGetStudy]: Failed to parse response object', error);
				throw error;
			}
		},
	});
};

export default useGetStudy;
