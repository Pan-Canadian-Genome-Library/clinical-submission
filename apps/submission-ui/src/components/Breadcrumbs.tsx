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
import { Link } from 'react-router';

type Crumb = {
	label: string;
	href?: string;
};

type BreadcrumbsProps = {
	crumbs: Crumb[];
};

const HomeIcon = () => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="currentColor"
		style={{ display: 'inline-block', verticalAlign: 'middle', marginBottom: '2px' }}
		aria-hidden="true"
	>
		<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
	</svg>
);

const Breadcrumbs = ({ crumbs }: BreadcrumbsProps) => {
	const { theme } = useTheme();

	const barStyle: React.CSSProperties = {
		backgroundColor: theme.colors.background.grey,
		borderBottom: `1px solid ${theme.colors.border.primary}`,
		padding: `${theme.spacing.lg} ${theme.spacing.lg}`,
	};

	const innerStyle: React.CSSProperties = {
		marginInline: 'auto',
		display: 'flex',
		alignItems: 'center',
		gap: '0.4rem',
		flexWrap: 'wrap',
	};

	const linkStyle: React.CSSProperties = {
		color: theme.colors.primary.main,
		textDecoration: 'none',
		fontSize: theme.typography.fontSize.sm,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '0.25rem',
	};

	const separatorStyle: React.CSSProperties = {
		color: theme.colors.text.secondary,
		fontSize: theme.typography.fontSize.sm,
		userSelect: 'none',
	};

	const currentStyle: React.CSSProperties = {
		color: theme.colors.text.secondary,
		fontSize: theme.typography.fontSize.sm,
	};

	return (
		<nav aria-label="Breadcrumb" style={barStyle}>
			<ol style={{ ...innerStyle, listStyle: 'none', margin: 0, padding: 0 }}>
				{crumbs.map((crumb, index) => {
					const isLast = index === crumbs.length - 1;
					const isFirst = index === 0;

					return (
						<li key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
							{index > 0 && <span style={separatorStyle}>/</span>}
							{isLast ? (
								<span style={currentStyle} aria-current="page">
									{crumb.label}
								</span>
							) : crumb.href ? (
								<Link to={crumb.href} style={linkStyle}>
									{isFirst && <HomeIcon />}
									{crumb.label}
								</Link>
							) : (
								<span style={currentStyle}>
									{isFirst && <HomeIcon />}
									{crumb.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
};

export default Breadcrumbs;
