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
import { useTranslation } from 'react-i18next';

type SpinnerProps = {
	size?: number;
	label?: string;
};

const Spinner = ({ size = 40, label }: SpinnerProps) => {
	const {
		i18n: { t },
	} = useTranslation();

	const currentLabel = label ?? t('common:spinner');
	const { theme } = useTheme();

	const wrapperStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		gap: theme.spacing.md,
		padding: '2rem',
	};

	const ringStyle: React.CSSProperties = {
		width: size,
		height: size,
		borderRadius: '50%',
		border: `3px solid ${theme.colors.border.primary}`,
		borderTopColor: theme.colors.primary.main,
		animation: `spinner 0.75s linear infinite`,
	};

	const labelStyle: React.CSSProperties = {
		color: theme.colors.text.secondary,
		fontSize: theme.typography.fontSize.sm,
	};

	return (
		<div style={wrapperStyle} role="status" aria-label={currentLabel}>
			<div style={ringStyle} aria-hidden="true" />
			<span style={labelStyle}>{currentLabel}</span>
		</div>
	);
};

export default Spinner;
