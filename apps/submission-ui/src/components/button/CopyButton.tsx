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

import clsx from 'clsx';
import { useState } from 'react';

import CopyIcon from '@/components/icons/CopyIcon';

// how long to show "Copied" appearance, in milliseconds
const copiedStateDelayMs = 500;

const copyTokenClick = async (textToCopy: string) => {
	try {
		await navigator.clipboard.writeText(textToCopy);
	} catch (e) {
		console.error(e);
	}
};

/**
 * React component for adding a button that allows the user to copy a provided string.
 */
const CopyButton = ({
	copiedText,
	copyText,
	textToCopy,
}: {
	copiedText: string;
	copyText: string;
	textToCopy: string;
}) => {
	const [isCopying, setIsCopying] = useState<boolean>(false);

	// copy textToCopy to keyboard, and switch button to/from "Copied" appearance
	const handleClick = async () => {
		if (isCopying) return;
		setIsCopying(true);
		await copyTokenClick(textToCopy);
		setTimeout(() => {
			setIsCopying(false);
		}, copiedStateDelayMs);
	};

	return (
		<button
			className={clsx(
				'font-semibold rounded-lg px-2 py-1 cursor-pointer transition-colors duration-300 text-sm  text-white no-underline block',
				isCopying ? 'bg-black hover:bg-black' : 'bg-primary-800 hover:bg-primary-700',
			)}
			type="button"
			onClick={handleClick}
		>
			<CopyIcon />
			{isCopying ? copiedText : copyText}
		</button>
	);
};

export default CopyButton;
