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

import Breadcrumbs from '@/components/Breadcrumbs';
import Spinner from '@/components/Spinner';
import StudyField from '@/components/StudyField';
import PageLayout from '@/components/layouts/PageLayout';
import SectionLayout from '@/components/layouts/SectionLayout';
import Text from '@/components/typography/Text';
import { useUserContext } from '@/providers/UserProvider';

const UserPage = () => {
	const { isLoading, user, isLoggedIn } = useUserContext();

	const {
		i18n: { t },
	} = useTranslation();

	if (isLoading) {
		return <Spinner label={t('common:user.loading')} />;
	}

	if (!isLoggedIn || !user) {
		return (
			<div className="p-8">
				<Text>{t('common:user.notLoggedIn')}</Text>
			</div>
		);
	}

	const userName =
		user.givenName || user.familyName
			? `${user.givenName || ''} ${user.familyName || ''}`.trim()
			: t('common:user.notProvided');

	const userEmails =
		user.emails && user.emails.length > 0
			? user.emails
					.filter(Boolean)
					.map((email) => email.address)
					.join(',')
			: t('common:user.noEmails');

	const userRole = user.siteAdmin
		? t('common:user.roles.siteAdmin')
		: user.dataAdmin
			? t('common:user.roles.dataAdmin')
			: t('common:user.roles.none');

	const userFields = [
		{ label: t('common:user.fields.name'), value: userName },
		{ label: t('common:user.fields.email'), value: userEmails },
		{ label: t('common:user.fields.role'), value: userRole },
	];

	const tokenFields = [
		{ label: t('common:user.fields.loggedInWith'), value: userName },
		{ label: t('common:user.fields.tokenExpires'), value: userName },
	];

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
					{userFields.map(({ label, value }) => (
						<StudyField key={label} label={label} value={value} />
					))}
				</div>

				<hr className="border-0 border-t border-gray-200 mb-6" />
				<div className="pt-4">
					<h2 className="text-1xl font-jost font-semibold text-gray-900 pb-4">{t('common:user.tokenInfo')}</h2>
					{tokenFields.map(({ label, value }) => (
						<StudyField key={label} label={label} value={value} />
					))}
				</div>
			</SectionLayout>
		</PageLayout>
	);
};

export default UserPage;
