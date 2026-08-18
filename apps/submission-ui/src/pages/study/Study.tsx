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

import { useTranslation } from 'react-i18next';
import { useMatch } from 'react-router';

import useGetStudy from '@/api/queries/useGetStudy';
import Breadcrumbs from '@/components/Breadcrumbs';
import Spinner from '@/components/Spinner';
import Text from '@/components/typography/Text';
import StudyField from '@/components/StudyField';
import SectionLayout from '@/components/layouts/SectionLayout';
import PageLayout from '@/components/layouts/PageLayout';

const StudyDetails = () => {
	const match = useMatch('study/:studyId');
	const studyId = match?.params.studyId;
	const { data: study, isLoading, isError } = useGetStudy({ studyId });

	const {
		i18n: { t },
	} = useTranslation();

	if (isLoading) {
		return <Spinner label={t('common:study.loading')} />;
	}

	if (isError || !study) {
		return (
			<div className="p-8">
				<Text>{t('common:study.error')}</Text>
			</div>
		);
	}

	const studyFields = [
		{ label: t('common:study.fields.studyName'), value: study.studyName },
		{ label: t('common:study.fields.description'), value: study.translations?.[0]?.studyDescription },
		{ label: t('common:study.fields.studyId'), value: study.studyId },
		{ label: t('common:study.fields.programName'), value: study.translations?.[0]?.programName },
		{ label: t('common:study.fields.keywords'), value: study.translations?.[0]?.keywords },
		{ label: t('common:study.fields.status'), value: study.status },
		{ label: t('common:study.fields.context'), value: study.context },
		{ label: t('common:study.fields.domain'), value: study.domain },
		{ label: t('common:study.fields.dacId'), value: study.dacId },
		{ label: t('common:study.fields.principalInvestigators'), value: study.principalInvestigators },
		{ label: t('common:study.fields.leadOrganizations'), value: study.leadOrganizations },
		{ label: t('common:study.fields.fundingSources'), value: study.translations?.[0]?.fundingSources },
		{ label: t('common:study.fields.collaborators'), value: study.collaborators },
		{ label: t('common:study.fields.publicationLinks'), value: study.publicationLinks },
		{ label: t('common:study.fields.participantCriteria'), value: study.translations?.[0]?.participantCriteria },
	];
	return (
		<PageLayout>
			<Breadcrumbs
				crumbs={[{ label: t('common:breadcrumbs.home'), href: '/' }, { label: t('common:breadcrumbs.studyDetails') }]}
			/>
			<SectionLayout className="bg-white px-25 pb-20">
				<h1 className="text-3xl font-jost font-semibold text-gray-900 m-0 mb-6 py-8">{t('common:study.pageTitle')}</h1>
				<hr className="border-0 border-t border-gray-200 mb-6" />

				<div className="pt-8">
					{studyFields.map(({ label, value }) => (
						<StudyField key={label} label={label} value={value} />
					))}
				</div>
			</SectionLayout>
		</PageLayout>
	);
};

export default StudyDetails;
