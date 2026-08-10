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
import Spinner from '@/components/Spinner';
import Text from '@/components/typography/Text';
import { useTranslation } from 'react-i18next';
import { useMatch } from 'react-router';

const StudyDetails = () => {
	const {
		params: { studyId },
	} = useMatch('study/:studyId');

	const { data: study, isLoading, isError } = useGetStudy({ studyId });

	const {
		i18n: { t },
	} = useTranslation();

	if (isLoading) {
		return <Spinner label={t('common:study.loading')} />;
	}

	if (isError) {
		return (
			<div className="p-8">
				<Text>{t('common:study.error')}</Text>
			</div>
		);
	}

	return (
		<div className="flex flex-col flex-1">
			<Breadcrumbs
				crumbs={[{ label: t('common:breadcrumbs.home'), href: '/' }, { label: t('common:breadcrumbs.studyDetails') }]}
			/>

			<div className="bg-white">
				<div className="w-[90%] mx-auto pt-6 pb-16">
					<h1 className="text-3xl font-semibold text-gray-900 m-0 mb-6 py-8">{t('common:study.pageTitle')}</h1>
					<hr className="border-0 border-t border-gray-200 mb-6" />

					<div className="pt-8">
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.studyName')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.studyName}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.description')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.translations[0].studyDescription}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.studyId')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.studyId}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.programName')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.translations[0].programName}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.keywords')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.translations[0].keywords.join(', ')}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.status')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.status}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.context')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.context}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.domain')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.domain}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.dacId')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.dacId}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.principalInvestigators')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.principalInvestigators.join(', ')}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.leadOrganizations')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.leadOrganizations.join(', ')}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.fundingSources')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.translations[0].fundingSources.join(', ')}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.collaborators')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.collaborators.join(', ')}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.publicationLinks')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.publicationLinks.join(', ')}</p>
						</div>
						<div className="flex items-start mb-4">
							<span className="min-w-[220px] font-semibold text-gray-900 text-base pt-[0.1rem] shrink-0">
								{t('common:study.fields.participantCriteria')}:
							</span>
							<p className="m-0 text-base leading-normal">{study?.translations[0].participantCriteria}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StudyDetails;
