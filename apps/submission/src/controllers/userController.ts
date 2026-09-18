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

const getUserStudies = async (req: Request, res: Response, next: NextFunction): Promise<void | null> => {
	const { user } = req.session;

	if (!user) {
		// No user session, this is an anon session
		return null;
	}

	const { editableStudies = [] } = user.studyAuthorizations;

	try {
		const studyRepo = studyService(getDbInstance());
		const userStudies = [];

		for (const studyId in editableStudies) {
			const studyResponse = await studyRepo.getStudyById(studyId);
			const { studyName } = studyResponse || {};
			studyName && userStudies.push(studyName);
		}

		const response = { userStudies };
		res.status(200).json(response);
	} catch (e) {
		logger.error(e, 'Error in getUserStudies');
		next(e);
	}
};

const getUserToken = async (req: Request, res: Response): Promise<void | null> => {
	const { account } = req.session;

	if (!account) {
		// No user session, this is an anon session
		return null;
	}

	const { refreshToken, refreshTokenIat } = account;

	const response = { userToken: refreshToken, refreshTokenIat };
	res.status(200).json(response);
};

export { getUserStudies, getUserToken };
