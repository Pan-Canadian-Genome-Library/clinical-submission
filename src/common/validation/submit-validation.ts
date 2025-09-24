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

import type { ParamsDictionary } from 'express-serve-static-core';
import type { ParsedQs } from 'qs';
import { z } from 'zod';

import { type RequestValidation } from '@/middleware/requestValidation.js';

interface SubmitRequestPathParams extends ParamsDictionary {
	categoryId: string;
}

export const submitRequestSchema: RequestValidation<
	{
		studyId: any;
		organization: string;
	},
	ParsedQs,
	SubmitRequestPathParams
> = {
	body: z.object({
		organization: z.string(),
		studyId: z.string(),
	}),
	pathParams: z.object({
		categoryId: z.string(),
	}),
};

interface EditRequestPathParams extends ParamsDictionary {
	categoryId: string;
}

export const editDataRequestSchema: RequestValidation<
	{
		studyId: any;
		organization: string;
	},
	ParsedQs,
	EditRequestPathParams
> = {
	body: z.object({
		organization: z.string(),
		studyId: z.string(),
	}),
	pathParams: z.object({
		categoryId: z.string(),
	}),
};
