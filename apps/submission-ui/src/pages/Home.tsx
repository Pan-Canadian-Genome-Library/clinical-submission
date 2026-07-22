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

import '@/styles/App.css';

import AuditIcon from '@/assets/audit-outlined.png';
import FileIcon from '@/assets/file-outlined.png';
import Hero from '@/assets/hero-bar.png';
import SignatureIcon from '@/assets/signature-outlined.png';
import UserIcon from '@/assets/user-outlined.png';
import Button from '@/components/button/Button';
import Footer from '@/components/Footer';
import HeaderPCGL from '@/components/Header';
import { Theme, useTheme } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

const Container = (): React.CSSProperties => ({
	position: 'relative',
	height: '100%',
	width: '100%',
	minHeight: '100vh',
	display: 'flex',
	flexDirection: 'column',
});

const MainContent = (): React.CSSProperties => ({
	flex: 1,
	width: '100%',
});

const heroSectionStyle: React.CSSProperties = {
	backgroundPosition: 'center',
	backgroundSize: 'cover',
	backgroundImage: `url(${Hero})`,
	padding: '4rem 2rem',
	minHeight: '400px',
	display: 'flex',
	justifyContent: 'center',
	alignItems: 'center',
};

const heroContentStyle: React.CSSProperties = {
	maxWidth: '1200px',
	width: '100%',
	margin: '0 auto',
};

const contentSectionStyle: React.CSSProperties = {
	backgroundColor: '#ffffff',
	padding: '3rem 2rem',
};

const contentWrapperStyle: React.CSSProperties = {
	maxWidth: '1200px',
	margin: '0 auto',
};

const twoColumnStyle: React.CSSProperties = {
	display: 'grid',
	gridTemplateColumns: '1fr 1fr',
	gap: '3rem',
	marginBottom: '3rem',
};

const iconCircleStyle = (theme: Theme, bgColor: string): React.CSSProperties => ({
	width: '50px',
	height: '50px',
	borderRadius: '50%',
	backgroundColor: bgColor,
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	flexShrink: 0,
	color: theme.colors.text.white,
	fontWeight: 'bold',
	fontSize: '1.2rem',
});

const iconImageStyle: React.CSSProperties = {
	width: '24px',
	height: '24px',
	objectFit: 'contain',
};

const stepContainerStyle: React.CSSProperties = {
	display: 'flex',
	gap: '1rem',
	marginBottom: '1.5rem',
	alignItems: 'flex-start',
};

const buttonGroupStyle: React.CSSProperties = {
	display: 'flex',
	gap: '1rem',
	alignItems: 'center',
	marginTop: '1.5rem',
};

function Home() {
	const { theme } = useTheme();
	const {
		i18n: { t },
	} = useTranslation();

	return (
		<div style={Container()}>
			<HeaderPCGL />
			<main style={MainContent()}>
				{/* Hero Section */}
				<section style={heroSectionStyle}>
					<div style={heroContentStyle}>
						<h1
							style={{
								color: theme.colors.text.white,
								fontSize: '2.5rem',
								marginBottom: '1rem',
								fontWeight: theme.typography.fontWeight.bold,
							}}
						>
							{t('common:hero.title')}
						</h1>
						<p
							style={{
								color: theme.colors.text.white,
								fontSize: theme.typography.fontSize.base,
								lineHeight: theme.typography.lineHeight.normal,
								marginBottom: '2rem',
								maxWidth: '800px',
							}}
						>
							{t('common:hero.description')}
						</p>
						<div style={buttonGroupStyle}>
							<Button type="secondary" defaultText={t('common:hero.submitFiles')} handler={() => {}} />
						</div>
					</div>
				</section>

				{/* Content Section */}
				<section style={contentSectionStyle}>
					<div style={contentWrapperStyle}>
						<div style={twoColumnStyle}>
							{/* Overview Section */}
							<div>
								<h2
									style={{
										color: theme.colors.text.primary,
										fontSize: theme.typography.fontSize.xl,
										marginBottom: '1rem',
										fontWeight: theme.typography.fontWeight.bold,
									}}
								>
									{t('common:overview.title')}
								</h2>
								<p
									style={{
										color: theme.colors.text.primary,
										fontSize: theme.typography.fontSize.base,
										lineHeight: theme.typography.lineHeight.normal,
										marginBottom: '1rem',
									}}
								>
									{t('common:overview.paragraph1')}
								</p>
								<p
									style={{
										color: theme.colors.text.primary,
										fontSize: theme.typography.fontSize.base,
										lineHeight: theme.typography.lineHeight.normal,
									}}
								>
									{t('common:overview.paragraph2')}
								</p>
							</div>

							{/* How to Register Section */}
							<div>
								<h2
									style={{
										color: theme.colors.text.primary,
										fontSize: theme.typography.fontSize.xl,
										marginBottom: '1.5rem',
										fontWeight: theme.typography.fontWeight.bold,
									}}
								>
									{t('common:howToRegister.title')}
								</h2>

								{/* Step 1 */}
								<div style={stepContainerStyle}>
									<div style={iconCircleStyle(theme, '#E8A4A2')}>
										<img src={AuditIcon} alt="" style={iconImageStyle} />
									</div>
									<p
										style={{
											color: theme.colors.text.primary,
											fontSize: theme.typography.fontSize.base,
											lineHeight: theme.typography.lineHeight.normal,
										}}
									>
										<a
											href="#helpdesk"
											style={{
												color: theme.colors.primary.main,
												textDecoration: 'underline',
											}}
										>
											{t('common:howToRegister.step1.linkText')}
										</a>{' '}
										{t('common:howToRegister.step1.text')}
									</p>
								</div>

								{/* Step 2 */}
								<div style={stepContainerStyle}>
									<div style={iconCircleStyle(theme, '#A8D5BA')}>
										<img src={SignatureIcon} alt="" style={iconImageStyle} />
									</div>
									<p
										style={{
											color: theme.colors.text.primary,
											fontSize: theme.typography.fontSize.base,
											lineHeight: theme.typography.lineHeight.normal,
										}}
									>
										{t('common:howToRegister.step2')}
									</p>
								</div>

								{/* Step 3 */}
								<div style={stepContainerStyle}>
									<div style={iconCircleStyle(theme, '#F4D35E')}>
										<img src={UserIcon} alt="" style={iconImageStyle} />
									</div>
									<p
										style={{
											color: theme.colors.text.primary,
											fontSize: theme.typography.fontSize.base,
											lineHeight: theme.typography.lineHeight.normal,
										}}
									>
										{t('common:howToRegister.step3')}
									</p>
								</div>

								{/* Step 4 */}
								<div style={stepContainerStyle}>
									<div style={iconCircleStyle(theme, '#A4C2E4')}>
										<img src={FileIcon} alt="" style={iconImageStyle} />
									</div>
									<p
										style={{
											color: theme.colors.text.primary,
											fontSize: theme.typography.fontSize.base,
											lineHeight: theme.typography.lineHeight.normal,
										}}
									>
										{t('common:howToRegister.step4')}
									</p>
								</div>
							</div>
						</div>

						{/* Submitting Genomic Data Section */}
						<div style={{ marginTop: '2rem' }}>
							<h2
								style={{
									color: theme.colors.text.primary,
									fontSize: theme.typography.fontSize.xl,
									marginBottom: '1rem',
									fontWeight: theme.typography.fontWeight.bold,
								}}
							>
								{t('common:genomicData.title')}
							</h2>
							<p
								style={{
									color: theme.colors.text.primary,
									fontSize: theme.typography.fontSize.base,
									lineHeight: theme.typography.lineHeight.normal,
									marginBottom: '1rem',
								}}
							>
								{t('common:genomicData.paragraph')}
							</p>
							<a
								href="#workflow"
								style={{
									color: theme.colors.primary.main,
									textDecoration: 'underline',
									fontSize: theme.typography.fontSize.base,
								}}
							>
								{t('common:genomicData.linkText')}
							</a>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}

export default Home;
