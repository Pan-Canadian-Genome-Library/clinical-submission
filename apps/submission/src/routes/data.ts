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

import express, { json, Router, urlencoded } from 'express';

import dataController from '@/controllers/dataController.js';
import { authMiddleware } from '@/middleware/auth.js';

export const dataRouter: Router = (() => {
	const router = express.Router();
	router.use(json());
	router.use(urlencoded({ extended: false }));

	// Public endpoints – do not require authentication
	router.get('/entity/:entityName/:externalId/exists', dataController.getDataIdExists);

	// Restricted endpoints - Admin or Submitter access required
	router.get('/category/:categoryId', authMiddleware(), dataController.getCategoryById);
	router.get('/category/:categoryId/id/:systemId', authMiddleware(), dataController.getCategoryBySystemId);
	router.get(
		'/category/:categoryId/organization/:organization',
		authMiddleware(),
		dataController.getCategoryByOrganization,
	);
	router.post(
		'/category/:categoryId/organization/:organization/query',
		authMiddleware(),
		dataController.getSubmittedDataByQuery,
	);

	// Restricted endpoints - Admin only access
	router.get(
		'/category/:categoryId/stream',
		authMiddleware({ requireAdmin: true }),
		dataController.getSubmittedDataStream,
	);

	return router;
})();
