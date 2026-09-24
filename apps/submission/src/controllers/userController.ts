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
import { NextFunction, Request, Response } from 'express';

import { logger } from '@/common/logger.js';
import { getDbInstance } from '@/db/index.js';
import { studyService } from '@/service/studyService.js';

// NOTE
// UI-only requests have been deliberately omitted from Swagger docs.
// They require a session cookie, and won't work in Swagger.

/**
 * Get the user's refresh token and the token's "time to live", for Submission UI. Requires a session cookie.
 */
const getRefreshToken = async (req: Request, res: Response): Promise<void | null> => {
	const { account } = req.session;
	if (!account) {
		res.status(400).send('Session required.');
		return;
	}

	const { refreshToken, refreshTokenIat } = account;

	const response = { refreshToken, refreshTokenIat };
	res.status(200).json(response);
};

/**
 * Get the user's editable studies, for data submitters, for Submission UI. Requires a session cookie.
 */
const getUserEditableStudies = async (req: Request, res: Response, next: NextFunction): Promise<void | null> => {
	const { user } = req.session;
	if (!user) {
		res.status(400).send('Session required.');
		return;
	}

	const { editableStudies = [] } = user.studyAuthorizations;

	try {
		const studyRepo = studyService(getDbInstance());
		const userEditableStudies = [];

		for (const studyId in editableStudies) {
			const studyResponse = await studyRepo.getStudyById(studyId);
			const { studyName } = studyResponse || {};
			studyName && userEditableStudies.push(studyName);
		}

		res.status(200).json(userEditableStudies);
	} catch (e) {
		logger.error(e, 'Error in getUserEditableStudies');
		next(e);
	}
};

export { getRefreshToken, getUserEditableStudies };
