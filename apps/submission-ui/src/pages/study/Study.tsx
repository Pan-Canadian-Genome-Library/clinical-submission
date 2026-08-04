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

import useGetStudy from '@/api/queries/useGetStudy';
import Breadcrumbs from '@/components/Breadcrumbs';
import Text from '@/components/typography/Text';
import { useTheme } from '@/styles/theme';
import { useTranslation } from 'react-i18next';
import { useMatch } from 'react-router';

const StudyDetails = () => {
	const {
		params: { studyId },
	} = useMatch('study/:studyId');

	const { theme } = useTheme();
	const { data: study, isLoading, isError } = useGetStudy({ studyId });

	const {
		i18n: { t },
	} = useTranslation();

	if (isLoading) {
		return (
			<div style={{ padding: '2rem' }}>
				<Text>Loading study information...</Text>
			</div>
		);
	}

	if (isError) {
		return (
			<div style={{ padding: '2rem' }}>
				<Text>Error loading study information. </Text>
			</div>
		);
	}

	const pageStyle: React.CSSProperties = {
		display: 'flex',
		flexDirection: 'column',
		flex: 1,
	};

	const contentStyle: React.CSSProperties = {
		width: '90%',
		marginInline: 'auto',
		padding: `${theme.spacing.lg} 0 ${theme.spacing.xxl}`,
	};

	const headingStyle: React.CSSProperties = {
		fontSize: theme.typography.fontSize.xxl,
		fontWeight: theme.typography.fontWeight.bold,
		color: theme.colors.text.primary,
		margin: 0,
		marginBottom: theme.spacing.lg,
		padding: '2rem 0 2rem 0',
	};

	const dividerStyle: React.CSSProperties = {
		border: 'none',
		borderTop: `1px solid ${theme.colors.border.primary}`,
		marginBottom: theme.spacing.lg,
	};

	const labelStyle: React.CSSProperties = {
		minWidth: '220px',
		fontWeight: theme.typography.fontWeight.bold,
		color: theme.colors.text.primary,
		fontSize: theme.typography.fontSize.base,
		paddingTop: '0.1rem',
		flexShrink: 0,
	};

	const rowStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'flex-start',
		marginBottom: theme.spacing.md,
	};

	return (
		<div style={pageStyle}>
			<Breadcrumbs
				crumbs={[{ label: t('common:breadcrumbs.home'), href: '/' }, { label: t('common:breadcrumbs.studyDetails') }]}
			/>

			<div style={{ backgroundColor: theme.colors.background.default }}>
				<div style={contentStyle}>
					<h1 style={headingStyle}>{t('common:study.pageTitle')}</h1>
					<hr style={dividerStyle} />

					<div style={{ paddingTop: '2rem' }}>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.studyName')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>{study?.studyName}</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.description')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.translations[0].studyDescription}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.studyId')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>{study?.studyId}</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.programName')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.translations[0].programName}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.keywords')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.translations[0].keywords.join(', ')}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.status')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>{study?.status}</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.context')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>{study?.context}</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.domain')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>{study?.domain}</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.dacId')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>{study?.dacId}</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.principalInvestigators')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.principalInvestigators.join(', ')}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.leadOrganizations')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.leadOrganizations.join(', ')}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.fundingSources')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.translations[0].fundingSources.join(', ')}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.collaborators')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.collaborators.join(', ')}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.publicationLinks')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.publicationLinks.join(', ')}
							</Text>
						</div>
						<div style={rowStyle}>
							<span style={labelStyle}>{t('common:study.fields.participantCriteria')}:</span>
							<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>
								{study?.translations[0].participantCriteria}
							</Text>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StudyDetails;
