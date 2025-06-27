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
 * ANY WAY OUT OF THE USE OF THIS SOF
 * */

import { z as zod } from 'zod';

export const ActionIDs = {
	WRITE: 'WRITE',
	READ: 'READ',
} as const;

export type ActionIDsValues = (typeof ActionIDs)[keyof typeof ActionIDs];

export type UserDataResponse = {
	emails: Email[];
	pcgl_id: string | number;
	study_authorizations: Record<string, StudyAuthorization>;
	groups: Group[];
};

export type Email = {
	address: string;
	type: string;
};

export type StudyAuthorization = {
	end_date: string;
	start_date: string;
	study_id: string;
};

export type Group = {
	id: number | string;
	description: string;
	name: string;
};

export type UserDataResponseErrorType = {
	error: string;
};
