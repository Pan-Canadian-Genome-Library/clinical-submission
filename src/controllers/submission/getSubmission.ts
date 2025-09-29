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

import { lyricProvider } from '@/core/provider.js';
import { hasAllowedAccess } from '@/external/pcglAuthZClient.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import { shouldBypassAuth } from '@/service/authService.js';

const getSubmissionById = validateRequest(
	lyricProvider.utils.schema.submissionByIdRequestSchema,
	async (req, res, next) => {
		try {
			const submissionId = Number(req.params.submissionId);
			const user = req.user;

			const authEnabled = !shouldBypassAuth(req);

			const submission = await lyricProvider.services.submission.getSubmissionById(submissionId);

			if (!submission) {
				throw new lyricProvider.utils.errors.NotFound(`Submission not found`);
			}

			const organization = submission?.organization;

			if (authEnabled && (!user || !hasAllowedAccess(organization, user.allowedReadOrganizations, user.isAdmin))) {
				throw new lyricProvider.utils.errors.Forbidden('You do not have permission to access this resource');
			}

			return res.status(200).send(submission);
		} catch (error) {
			next(error);
		}
	},
);

const getSubmissionsByCategory = validateRequest(
	lyricProvider.utils.schema.submissionsByCategoryRequestSchema,
	async (req, res, next) => {
		try {
			const categoryId = Number(req.params.categoryId);
			const onlyActive = req.query.onlyActive?.toLowerCase() === 'true';
			const organization = req.query.organization;
			const page = parseInt(String(req.query.page)) || 1;
			const pageSize = parseInt(String(req.query.pageSize)) || 20;
			const user = req.user;

			const authEnabled = !shouldBypassAuth(req);

			// Early check to prevent auth db action
			if (authEnabled && !user) {
				throw new lyricProvider.utils.errors.Forbidden('Unauthorized: Unable to authorize user');
			}

			const submissionsResult = await lyricProvider.services.submission.getSubmissionsByCategory(
				categoryId,
				{ page, pageSize },
				{ onlyActive, username: user?.username ?? 'AUTH-DISABLED', organization },
			);

			if (submissionsResult.metadata.totalRecords === 0) {
				throw new lyricProvider.utils.errors.NotFound(`Submission not found`);
			}

			// Auth enabled only logic
			if (authEnabled) {
				const retrievedOrg = submissionsResult.result[0]?.organization;
				// User can provide an organization optionally, if they do, we check against that input instead of the returned org from submissionsResult
				const orgToCheck = organization ?? retrievedOrg;

				if (!orgToCheck || !user || !hasAllowedAccess(orgToCheck, user.allowedReadOrganizations, user.isAdmin)) {
					throw new lyricProvider.utils.errors.Forbidden('You do not have permission to access this resource');
				}
			}

			const response = {
				pagination: {
					currentPage: page,
					pageSize: pageSize,
					totalPages: Math.ceil(submissionsResult.metadata.totalRecords / pageSize),
					totalRecords: submissionsResult.metadata.totalRecords,
				},
				records: submissionsResult.result,
			};

			return res.status(200).send(response);
		} catch (error) {
			next(error);
		}
	},
);

export default { getSubmissionById, getSubmissionsByCategory };
