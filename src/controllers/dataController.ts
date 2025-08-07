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

import { getDataById } from '@/common/validation/data-validation.js';
import { env } from '@/config/envConfig.js';
import { getDbInstance } from '@/db/index.js';
import { generateHash } from '@/internal/id-manager/utils.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import iimService from '@/service/idManagerService.js';

const getDataIdExists = validateRequest(getDataById, async (req, res, next) => {
	const db = getDbInstance();
	const iimRepo = iimService(db);

	try {
		const { id, entityName, parentId } = req.params;

		const idConfigResult = await iimRepo.getIIMConfig(entityName);

		//  Check if entityName exists
		if (!idConfigResult[0]) {
			res.status(404).send(false);
			return;
		}

		const idmHash = generateHash(String(id), env.ID_MANAGER_SECRET);

		const generatedIdentifierResult = await iimRepo.getIDByHash(idmHash, parentId);

		// Check if the hash has been generated for ANY entity
		if (!generatedIdentifierResult[0]) {
			res.status(200).send(false);
			return;
		}

		//  Check if parentId exists, if yes, that means getIDByHash also searched for its internal id(parentId)
		//    If generatedIdentifierResult has a value with lookup with BOTH idmHash and parentId, then it exists
		if (parentId && generatedIdentifierResult[0]) {
			res.status(200).send(true);
			return;
		}

		// Check if both the idConfigResult row id matches the row id for the generatedIdentifierResult row
		if (generatedIdentifierResult[0]?.configId !== idConfigResult[0]?.id) {
			res.status(200).send(false);
			return;
		}

		res.status(200).send(true);
		return;
	} catch (exception) {
		next(exception);
	}
});

export default { getDataIdExists };
