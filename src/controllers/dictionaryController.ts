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

import { registerDictionaryValidation } from '@/common/validation/dictionary-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import { validateRequest } from '@/middleware/requestValidation.js';
import { studyService } from '@/service/studyService.js';

const registerDictionary = validateRequest(registerDictionaryValidation, async (req, res, next) => {
	try {
		const { studyId, categoryName, dictionaryName, dictionaryVersion, defaultCentricEntity } = req.body;

		const db = getDbInstance();
		const studyRepo = studyService(db);

		const foundStudy = await studyRepo.getStudyById(studyId);
		if (!foundStudy) {
			return res.status(404).json({ error: `Study with ID ${studyId} not found` });
		}

		const { dictionary, category } = await lyricProvider.services.dictionary.register({
			categoryName,
			dictionaryName,
			dictionaryVersion,
			defaultCentricEntity,
		});

		await studyRepo.updateStudy(studyId, { categoryId: category.id });

		return res.status(200).json({ dictionary, category });
	} catch (exception) {
		next(exception);
	}
});

export default { registerDictionary };
