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

import { useTheme } from '@/styles/theme';
import { useState } from 'react';
import Text from '../typography/Text';

type ButtonProps = {
	children?: React.ReactNode;
	defaultText: string;
	handler: () => void;
	type?: 'primary' | 'secondary';
};

/**
 * A button component that supports both text and children content.
 * If a children prop is provided, it will be used instead of the default text.
 * @param props
 * @returns
 */
const Button = (props: ButtonProps) => {
	const { theme } = useTheme();
	const [isHovered, setIsHovered] = useState(false);
	const buttonType = props.type ?? 'primary';

	const isPrimary = buttonType === 'primary';

	const buttonStyle: React.CSSProperties = {
		backgroundColor: isPrimary
			? isHovered
				? theme.colors.primary.main
				: theme.colors.primary.dark
			: isHovered
				? theme.colors.background.grey
				: theme.colors.background.default,
		color: isPrimary ? theme.colors.background.default : theme.colors.secondary.black,
		borderRadius: '8px',
		padding: `${theme.spacing.sm} ${theme.spacing.sm}`,
		border: isPrimary ? 'none' : `1px solid ${theme.colors.background.grey}`,
		cursor: 'pointer',
		transition: 'background-color 0.3s ease',
	};

	return (
		<button
			style={buttonStyle}
			onClick={() => props.handler()}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<Text
				styles={{
					color: isPrimary ? theme.colors.text.white : theme.colors.secondary.black,
					fontWeight: theme.typography.fontWeight.bold,
				}}
			>
				{props.children ?? props.defaultText}
			</Text>
		</button>
	);
};

export default Button;
