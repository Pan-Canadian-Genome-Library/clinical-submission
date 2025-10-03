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

import { VIEW_TYPE, ViewType } from '@overture-stack/lyric';

/**
 * Ensure a value is wrapped in an array.
 *
 * If passed an array, return it returns the same array. If passed a single item, wrap it in an array.
 * The function then filters out any empty strings and `undefined` values
 * @param val an item or array
 * @return an array
 */
export const asArray = <T>(val: T | T[]): T[] => {
	const result = Array.isArray(val) ? val : [val];
	return result.filter((item) => item !== null && item !== '' && item !== undefined);
};

/**
 * Convert a value into it's View type if it matches.
 * Otherwise it returns `undefined`
 * @param {unknown} value
 * @returns {ViewType | undefined}
 */
export const convertToViewType = (value: unknown): ViewType | undefined => {
	if (typeof value === 'string') {
		const parseResult = VIEW_TYPE.safeParse(value.trim().toLowerCase());

		if (parseResult.success) {
			return parseResult.data;
		}
	}
	return undefined;
};
