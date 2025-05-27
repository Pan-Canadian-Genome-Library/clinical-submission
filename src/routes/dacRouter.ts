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

import express from 'express';

import { withParamsSchemaValidation } from '@/common/validation-utils/request-utils/validation.js';
import { apiZodErrorMapping } from '@/common/validation-utils/request-utils/zodErrorMapping.js';
import { ResponseWithData } from '@/common/validation-utils/types.js';
import { getDacSchema } from '@/common/validation-utils/validation/routes/dac.js';

const dacRouter = express.Router();
// Just a test endpoint for validation, likely to be changed or removed
dacRouter.get(
	'/:dacId',
	withParamsSchemaValidation(
		getDacSchema,
		apiZodErrorMapping,
		async (_, response: ResponseWithData<any, ['INVALID_REQUEST']>) => {
			try {
				console.log('test');
				response.status(200).json({});
				return;
			} catch (e) {
				response.status(500).json({ error: 'INVALID_REQUEST', message: 'Application not found.' }).send();
				return;
			}
		},
	),
);

export default dacRouter;
