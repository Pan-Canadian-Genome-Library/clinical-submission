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

import Breadcrumbs from '@/components/Breadcrumbs';
import Text from '@/components/typography/Text';
import { useUserContext } from '@/providers/UserProvider';
import { useTheme } from '@/styles/theme';
import { useTranslation } from 'react-i18next';

type StudyField = {
	label: string;
	value: React.ReactNode;
};

const mockStudy = {
	studyName: 'La biobanque québécois de la COVID-19',
	description:
		'COVID-19 remains a major public health concern, with long-term effects including post-acute COVID-19 conditions (Long COVID). The Quebec COVID-19 Biobank (BQC19) is a multicentre, prospective cohort and biobank initiative designed to study how host factors, immune responses, and clinical characteristics influence COVID-19 severity and long-term outcomes (hypothesis). The study collects clinical, biological, and socio-demographic data, along with biospecimens, across multiple sites in Quebec (design), enabling research that informs patient care and public health while promoting open and accessible data sharing.',
	studyId: 'PCGLST0001',
	programName: 'PCGLST0001',
	keywords: 'PCGLST0001',
	status: 'PCGLST0001',
	context: 'PCGLST0001',
	domain: 'PCGLST0001',
	dacId: 'PCGLST0001',
	principalInvestigators: 'PCGLST0001',
	leadOrganizations: 'PCGLST0001',
	fundingSources: 'PCGLST0001',
	collaborators: 'PCGLST0001',
	publicationLinks: 'PCGLST0001',
	participantCriteria: 'PCGLST0001',
};

const StudyDetails = () => {
	const { theme } = useTheme();
	const { isLoading, isLoggedIn, user } = useUserContext();
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

	if (!isLoggedIn || !user) {
		return (
			<div style={{ padding: '2rem' }}>
				<Text>You are not logged in. Please log in to view study details.</Text>
			</div>
		);
	}

	const fields: StudyField[] = [
		{ label: 'Study Name', value: mockStudy.studyName },
		{ label: 'Description', value: mockStudy.description },
		{ label: 'Study ID', value: mockStudy.studyId },
		{ label: 'Program Name', value: mockStudy.programName },
		{ label: 'Keywords', value: mockStudy.keywords },
		{ label: 'Status', value: mockStudy.status },
		{ label: 'Context', value: mockStudy.context },
		{ label: 'Domain', value: mockStudy.domain },
		{ label: 'DAC ID', value: mockStudy.dacId },
		{ label: 'Principal Investigators', value: mockStudy.principalInvestigators },
		{ label: 'Lead Organizations', value: mockStudy.leadOrganizations },
		{ label: 'Funding Sources', value: mockStudy.fundingSources },
		{ label: 'Collaborators', value: mockStudy.collaborators },
		{ label: 'Publication Links', value: mockStudy.publicationLinks },
		{ label: 'Participant Criteria', value: mockStudy.participantCriteria },
	];

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
	};

	const dividerStyle: React.CSSProperties = {
		border: 'none',
		borderTop: `1px solid ${theme.colors.border.primary}`,
		marginBottom: theme.spacing.lg,
	};

	const fieldRowStyle: React.CSSProperties = {
		display: 'flex',
		alignItems: 'flex-start',
		marginBottom: theme.spacing.md,
	};

	const labelStyle: React.CSSProperties = {
		minWidth: '200px',
		fontWeight: theme.typography.fontWeight.bold,
		color: theme.colors.text.primary,
		fontSize: theme.typography.fontSize.base,
		paddingTop: '0.1rem',
		flexShrink: 0,
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

					<div>
						{fields.map(({ label, value }) => (
							<div key={label} style={fieldRowStyle}>
								<span style={labelStyle}>{label}:</span>
								<Text styles={{ margin: 0, lineHeight: theme.typography.lineHeight.normal }}>{value}</Text>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default StudyDetails;
