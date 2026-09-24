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

import useGetRefreshToken from '@/api/queries/useGetRefreshToken';
import useGetAllStudies from '@/api/queries/useGetAllStudies';
import useGetUserEditableStudies from '@/api/queries/useGetUserEditableStudies';
import Breadcrumbs from '@/components/Breadcrumbs';
import Spinner from '@/components/Spinner';
import StudyField from '@/components/StudyField';
import CopyButton from '@/components/button/CopyButton';
import PageLayout from '@/components/layouts/PageLayout';
import SectionLayout from '@/components/layouts/SectionLayout';
import Text from '@/components/typography/Text';
import { useUserContext } from '@/providers/UserProvider';

const UserProfile = () => {
	const { isLoading, user, isLoggedIn } = useUserContext();
	const {
		data: refreshTokenResponse,
		isLoading: refreshTokenLoading,
		isError: refreshTokenError,
	} = useGetRefreshToken();
	const { data: userStudies, isLoading: userStudiesLoading, isError: userStudiesError } = useGetUserEditableStudies();
	const { data: allStudies, isLoading: allStudiesLoading, isError: allStudiesError } = useGetAllStudies();

	const { refreshToken, refreshTokenIat } = refreshTokenResponse || {};
	const { dataAdmin, emails, familyName, givenName, idpName } = user || {};

	const {
		i18n: { t },
	} = useTranslation();

	if (isLoading || userStudiesLoading || refreshTokenLoading || allStudiesLoading) {
		return <Spinner label={t('common:user.loading')} />;
	}

	if (!isLoggedIn || !user) {
		return (
			<div className="p-8">
				<Text>{t('common:user.notLoggedIn')}</Text>
			</div>
		);
	}

	if (userStudiesError || refreshTokenError || !refreshToken || !userStudies || allStudiesError || !allStudies) {
		return (
			<div className="p-8">
				<Text>{t('common:user.error')}</Text>
			</div>
		);
	}

	const userName =
		givenName || familyName ? `${givenName || ''} ${familyName || ''}`.trim() : t('common:user.notProvided');

	const userEmails =
		emails && emails.length > 0 ? emails.map((email) => email.address).join(', ') : t('common:user.noEmails');

	// users are either data admins or data submitters
	const userRole = dataAdmin ? t('common:user.roles.dataAdmin') : t('common:user.roles.dataSubmitter');

	// get token expiry datetime & user's timezone
	const tokenTimeToLive = Date.now() + (refreshTokenIat || 0);
	const refreshTokenExpires = new Date(tokenTimeToLive)?.toLocaleString(t('common:dateLang'), {
		dateStyle: 'short',
		timeStyle: 'medium',
	});
	const userTimeZone = Intl.DateTimeFormat(t('common:dateLang'), { timeZoneName: 'short' })
		.formatToParts()
		.find((part) => part.type === 'timeZoneName')?.value;

	const userFields = [
		{ label: t('common:user.fields.name'), value: userName },
		{ label: t('common:user.fields.email'), value: userEmails },
		{ label: t('common:user.fields.role'), value: userRole },
	];

	const tokenFields = [
		{ label: t('common:user.fields.loggedInWith'), value: idpName },
		{ label: t('common:user.fields.tokenExpires'), value: `${refreshTokenExpires} ${userTimeZone}` },
	];

	// data admins: list all studies
	// data submitters: list the user's editable studies
	const studies = dataAdmin ? allStudies.map((study) => study.studyName) : userStudies;

	return (
		<PageLayout>
			<Breadcrumbs
				crumbs={[{ label: t('common:breadcrumbs.home'), href: '/' }, { label: t('common:breadcrumbs.userProfile') }]}
			/>
			<SectionLayout className="bg-white px-25 pb-20">
				<h1 className="text-3xl font-jost font-semibold text-gray-900 py-16">{t('common:user.pageTitle')}</h1>

				<hr className="border-0 border-t border-gray-200 mb-6" />
				<div className="pt-4 pb-8">
					<h2 className="text-1xl font-jost font-semibold text-gray-900 pb-4">{t('common:user.userInfo')}</h2>

					<div className="grid grid-cols-2">
						<div>
							{userFields.map(({ label, value }) => (
								<StudyField key={label} label={label} value={value} />
							))}
						</div>
						{studies.length > 0 && (
							<div>
								<span className="min-w-55  text-black text-base pt-[0.1rem] shrink-0">
									{t('common:user.canSubmit')}:
								</span>
								<ul className="m-0 text-base leading-normal list-disc pl-5">
									{studies.map((study: string) => (
										<li key={study}>{study}</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</div>

				<hr className="border-0 border-t border-gray-200 mb-6" />
				<div className="pt-4">
					<div className="grid grid-cols-2">
						<div>
							<h2 className="text-1xl font-jost font-semibold text-gray-900 pb-4">{t('common:user.tokenInfo')}</h2>
							{tokenFields.map(({ label, value }) => (
								<StudyField key={label} label={label} value={value} />
							))}
						</div>
						<div>
							<h2 className="text-1xl font-jost font-semibold text-gray-900 pb-4">
								{t('common:user.accessTokenTitle')}
							</h2>
							<p className="mb-2">{t('common:user.accessTokenDescription')}</p>
							<div className="flex flex-col items-end">
								<input
									className="border border-gray-300 text-lg rounded-lg focus:ring-brand focus:border-brand block w-full px-2 py-1 placeholder:text-body mb-2"
									type="password"
									value={refreshToken}
									name="refreshToken"
									id="refreshToken"
									readOnly
									aria-readonly
								/>
								<CopyButton
									textToCopy={refreshToken}
									copyText={t('common:user.copy')}
									copiedText={t('common:user.copied')}
								/>
							</div>
						</div>
					</div>
				</div>
			</SectionLayout>
		</PageLayout>
	);
};

export default UserProfile;
