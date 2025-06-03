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

import { Request, Response } from 'express';

import { getDacByIdData } from '@/common/validation/dac-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import dacService from '@/service/dacService.js';

const getDacById = validateRequest(getDacByIdData, async (req: Request, res: Response, next) => {
	try {
		const database = getDbInstance();
		const dacSvc = await dacService(database);

		const dacId = req.params.dacId;

		if (!dacId) {
			throw new lyricProvider.utils.errors.BadRequest(`No dacId has been provided`);
		}

		const result = await dacSvc.getDacById(dacId);

		res.status(200).send(result);
		return;
	} catch (err) {
		next(err);
	}
});

const createDac = validateRequest(getDacByIdData, async (req: Request, res: Response, next) => {
	try {
		const database = getDbInstance();
		const dacSvc = await dacService(database);

		const dacId = req.params.dacId;

		if (!dacId) {
			throw new lyricProvider.utils.errors.BadRequest(`No dacId has been provided`);
		}

		const result = await dacSvc.getDacById(dacId);

		res.status(200).send(result);
		return;
	} catch (err) {
		next(err);
	}
});

export default { getDacById, createDac };
