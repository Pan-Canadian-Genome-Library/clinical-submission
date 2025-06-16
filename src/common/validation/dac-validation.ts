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

import { ParamsDictionary } from 'express-serve-static-core';
import { ParsedQs } from 'qs';
import { z } from 'zod';

import { RequestValidation } from '@/middleware/requestValidation.js';

import { DACFields } from '../types/dac.js';
import { PaginationParams, positiveInteger, stringNotEmpty, stringNotEmptyOptional } from './common.js';

interface DacIdParams extends ParamsDictionary {
	dacId: string;
}

export const getAllDacData: RequestValidation<object, PaginationParams, ParamsDictionary> = {
	query: z.object({
		orderBy: stringNotEmptyOptional,
		page: positiveInteger.optional(),
		pageSize: positiveInteger.optional(),
	}),
};

export const getDacByIdData: RequestValidation<object, ParsedQs, DacIdParams> = {
	pathParams: z.object({
		dacId: stringNotEmpty,
	}),
};

export type CreateDacDataFields = Omit<DACFields, 'updatedAt' | 'createdAt'>;

export const createDacData: RequestValidation<CreateDacDataFields, ParsedQs, ParamsDictionary> = {
	body: z.object({
		dacId: stringNotEmpty,
		dacName: stringNotEmpty,
		dacDescription: stringNotEmpty,
		contactName: stringNotEmpty,
		contactEmail: stringNotEmpty,
	}),
};

export const deleteDacByIdData: RequestValidation<object, ParsedQs, DacIdParams> = {
	pathParams: z.object({
		dacId: stringNotEmpty,
	}),
};

export type UpdateDacDataFields = Partial<Omit<DACFields, 'dacId' | 'updatedAt' | 'createdAt'>>;

export const updateDacByIdData: RequestValidation<UpdateDacDataFields, ParsedQs, DacIdParams> = {
	pathParams: z.object({
		dacId: stringNotEmpty,
	}),
	body: z.object({
		dacName: stringNotEmptyOptional,
		dacDescription: stringNotEmptyOptional,
		contactName: stringNotEmptyOptional,
		contactEmail: stringNotEmptyOptional,
	}),
};
