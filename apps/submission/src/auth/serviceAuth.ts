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

import { Request } from 'express';

import type { PCGLRequestAuth } from '@/auth/types.js';
import { lyricProvider } from '@/core/provider.js';

/**
 * Request headers used by PCGL service-to-service authorization. A service identifies itself with its
 * AuthZ service ID and proves it with a service token issued to it by AuthZ.
 */
export const ServiceAuthHeaders = {
	SERVICE_ID: 'X-Service-ID',
	SERVICE_TOKEN: 'X-Service-Token',
} as const;

export type ServiceCredentials = {
	serviceId: string;
	serviceToken: string;
};

/**
 * Reads the service ID and service token headers from a request.
 *
 * Returns undefined when neither header is present, meaning the request was not made by a service.
 *
 * @throws Forbidden when only one of the two headers is present.
 */
export const extractServiceCredentialsFromHeader = (req: Request): ServiceCredentials | undefined => {
	const serviceId = req.get(ServiceAuthHeaders.SERVICE_ID);
	const serviceToken = req.get(ServiceAuthHeaders.SERVICE_TOKEN);

	if (!serviceId && !serviceToken) {
		return undefined;
	}

	if (!serviceId || !serviceToken) {
		throw new lyricProvider.utils.errors.Forbidden(
			`Unauthorized: Service requests require both the ${ServiceAuthHeaders.SERVICE_ID} and ${ServiceAuthHeaders.SERVICE_TOKEN} headers`,
		);
	}

	return { serviceId, serviceToken };
};

/**
 * Checks whether a request was authenticated as a service whose token AuthZ verified.
 * Returns false when the request has no auth result or was made by a user.
 */
export const isAuthorizedService = (auth?: PCGLRequestAuth): boolean => {
	return auth?.service?.verified === true;
};
