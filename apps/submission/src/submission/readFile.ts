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

import type { Schema } from '@overture-stack/lyric';
import { parse as csvParse } from 'csv-parse';
import firstline from 'firstline';
import fs from 'fs';

import { getSeparatorCharacter } from '@/submission/format.js';

/**
 * This function removes extra double quotations from a given string.
 * Usually csv or tsv exported from excel might add double quotations to indicate string and escape double quotes
 *
 * @param data The data to format
 * @returns
 */
function formatForExcelCompatibility(data: string) {
	return data
		.trim()
		.replace(/^"/, '') // excel might add a beginning double quotes to indicate string
		.replace(/"$/, '') // excel might add a trailing double quote to indicate string
		.replace(/""/g, '"') // excel might've used a second double quote to escape a double quote in a string
		.trim();
}

/**
 * Maps a record array to an object with keys from headers, formatting each value for compatibility.
 * @param headers An array of header names, used as keys for the returned object.
 * @param record An array of values corresponding to each header, to be formatted and mapped.
 * @returns An `Record<string, string>` object where each header in `headers` is a key,
 *          and each value is the corresponding entry in `record` formatted for compatibility.
 */
export const mapRecordToHeaders = (headers: string[], record: string[]) => {
	return headers.reduce((obj: Record<string, string>, nextKey, index) => {
		const dataStr = record[index] || '';
		const formattedData = formatForExcelCompatibility(dataStr);
		obj[nextKey] = formattedData;
		return obj;
	}, {});
};

/**
 * Read a file and parse field names based on schema definition
 * Supported files: .tsv or .csv
 * @param {Express.Multer.File} file A file to read
 * @param {Schema} schema Schema to parse field names
 * @returns an array of records where each record is a key-value pair object representing
 * a row in the file.
 */
export const parseFileToRecords = async (
	file: Express.Multer.File,
	schema: Schema,
): Promise<Record<string, string>[]> => {
	const returnRecords: Record<string, string>[] = [];
	const separatorCharacter = getSeparatorCharacter(file.originalname);
	if (!separatorCharacter) {
		throw new Error('Invalid file Extension');
	}

	let headers: string[] = [];

	const schemaDisplayNames = schema.fields.reduce<Record<string, string>>((acc, field) => {
		acc[field.displayName?.toString() || field.meta?.displayName?.toString() || field.name] = field.name;
		return acc;
	}, {});

	return new Promise((resolve, reject) => {
		const stream = fs.createReadStream(file.path).pipe(csvParse({ delimiter: separatorCharacter }));

		stream.on('data', (record: string[]) => {
			if (!headers.length) {
				headers = record
					.map((value) => schemaDisplayNames[value] ?? value)
					.filter((value) => value)
					.map((str) => str.trim());
			} else {
				const mappedRecord = mapRecordToHeaders(headers, record);

				returnRecords.push(mappedRecord);
			}
		});

		stream.on('end', () => {
			resolve(returnRecords);
		});
		stream.on('error', (error) => {
			reject(error.message);
		});

		stream.on('close', () => {
			stream.destroy();
			fs.unlink(file.path, () => { });
		});
	});
};

/**
 * Reads only first line of the file
 * Usefull when file is too large and we're only interested in column names
 * @param file A file we want to read
 * @returns a string with the content of the first line of the file
 */
export const readHeaders = async (file: Express.Multer.File) => {
	return firstline(file.path);
};
