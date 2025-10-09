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

import bytes from 'bytes';
import { z } from 'zod';

import { logger } from '@/common/logger.js';

export const SUPPORTED_FILE_EXTENSIONS = z.enum(['tsv', 'csv']);
export type SupportedFileExtensions = z.infer<typeof SUPPORTED_FILE_EXTENSIONS>;

export const columnSeparatorValue = {
	tsv: '\t',
	csv: ',',
} as const satisfies Record<SupportedFileExtensions, string>;

/**
 * Extracts the extension from the filename and returns it if it's supported.
 * Otherwise it returns undefined.
 * @param {string} fileName
 * @returns {SupportedFileExtensions | undefined}
 */
export const extractFileExtension = (fileName: string): SupportedFileExtensions | undefined => {
	// Extract the file extension
	const fileExtension = fileName.split('.').pop()?.toLowerCase();

	try {
		// Parse to validate the extension against the Zod enum
		return SUPPORTED_FILE_EXTENSIONS.parse(fileExtension);
	} catch (error) {
		logger.error(error, `Error extracting file extension`);
		return;
	}
};

/**
 * Determines the separator character for a given file based on its extension.
 * @param fileName The name of the file whose extension determines the separator character.
 * @returns The separator character associated with the file extension, or `undefined` if
 *          the file extension is invalid or unrecognized.
 */
export const getSeparatorCharacter = (fileName: string): string | undefined => {
	const fileExtension = extractFileExtension(fileName);
	if (fileExtension) {
		return columnSeparatorValue[fileExtension];
	}
	return;
};

/**
 * Parse the string or number value into an integer in bytes.
 * If value is a number it is assumed is in bytes.
 * @param size
 * @returns
 */
export function getSizeInBytes(size: string | number): number {
	return bytes.parse(size) || 0;
}
