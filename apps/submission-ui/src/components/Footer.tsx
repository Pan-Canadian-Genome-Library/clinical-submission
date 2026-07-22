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

import CIHRLogo from '@/assets/cihr-logo.png';
import PCGLLogoWhite from '@/assets/pcgl-logo-white.png';
import { useMinWidth } from '@/global/hooks/useMinWidth';
import { Theme, useTheme } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

const FooterStyles = (theme: Theme): React.CSSProperties => ({
	backgroundColor: theme.colors.primary.light,
	color: theme.colors.text.white,
	width: '100%',
	padding: '2rem 2rem',
});

const FooterContent = (minWidth: number): React.CSSProperties => ({
	display: 'flex',
	flexDirection: minWidth < 768 ? 'column' : 'row',
	justifyContent: 'space-between',
	gap: '3rem',
});

const LogoSection = (): React.CSSProperties => ({
	flex: '1',
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
});

const LogoContainer = (): React.CSSProperties => ({
	display: 'flex',
	gap: '1.5rem',
	alignItems: 'center',
});

const LogoStyle: React.CSSProperties = {
	height: '40px',
	objectFit: 'contain',
};

const LinksSection = (minWidth: number): React.CSSProperties => ({
	display: 'flex',
	flexDirection: minWidth < 768 ? 'column' : 'row',
	alignItems: minWidth < 768 ? 'flex-start' : 'center',
	gap: minWidth < 768 ? '2rem' : '3rem',
});

const LinkColumn = (): React.CSSProperties => ({
	display: 'flex',
	flexDirection: 'column',
	gap: '1.50rem',
});

const LinkStyle = (theme: Theme): React.CSSProperties => ({
	color: theme.colors.text.white,
	textDecoration: 'underline',
	fontSize: theme.typography.fontSize.sm,
	cursor: 'pointer',
});

const TextStyle = (theme: Theme): React.CSSProperties => ({
	color: theme.colors.text.white,
	fontSize: theme.typography.fontSize.sm,
	lineHeight: theme.typography.lineHeight.normal,
	margin: 0,
});

const Footer = () => {
	const {
		i18n: { t },
	} = useTranslation('common');
	const currentDate = new Date().getFullYear();
	const { theme } = useTheme();
	const minWidth = useMinWidth();

	return (
		<footer style={FooterStyles(theme)}>
			<div style={FooterContent(minWidth)}>
				{/* Left Section - Logos and Text */}
				<div style={LogoSection()}>
					<div style={LogoContainer()}>
						<img src={PCGLLogoWhite} alt="PCGL Logo" style={LogoStyle} />
						<img src={CIHRLogo} alt="CIHR Logo" style={LogoStyle} />
					</div>
					<p style={TextStyle(theme)}>{t('common:footer.supportedBy')}</p>
					<p style={TextStyle(theme)}>{t('common:footer.copyright', { date: currentDate })}</p>
				</div>

				{/* Right Section - Links */}
				<div style={LinksSection(minWidth)}>
					{/* Column 1 */}
					<div style={LinkColumn()}>
						<a href="#contact" style={LinkStyle(theme)}>
							{t('common:footer.contactUs')}
						</a>
						<a href="#controlled-users" style={LinkStyle(theme)}>
							{t('common:footer.controlledDataUsers')}
						</a>
						<a href="#privacy" style={LinkStyle(theme)}>
							{t('common:footer.privacyPolicy')}
						</a>
					</div>

					{/* Column 2 */}
					<div style={LinkColumn()}>
						<a href="#policies" style={LinkStyle(theme)}>
							{t('common:footer.policiesGuidelines')}
						</a>
						<a href="#website" style={LinkStyle(theme)}>
							{t('common:footer.pcglWebsite')}
						</a>
						<a href="#terms" style={LinkStyle(theme)}>
							{t('common:footer.termsConditions')}
						</a>
					</div>

					{/* Column 3 */}
					<div style={LinkColumn()}>
						<a href="#help" style={LinkStyle(theme)}>
							{t('common:footer.helpGuides')}
						</a>
						<a href="#platform" style={LinkStyle(theme)}>
							{t('common:footer.dataPlatform')}
						</a>
						<a href="#publication" style={LinkStyle(theme)}>
							{t('common:footer.publicationPolicy')}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
