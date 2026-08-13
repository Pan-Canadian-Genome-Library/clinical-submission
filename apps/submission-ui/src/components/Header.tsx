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

import { API_PATH_LOGIN, API_PATH_LOGOUT } from '@/api/paths';
import { clearLangSessionInformation, setLangSessionInformation, SupportedLangs } from '@/global/localstorage/language';
import i18n from '@/i18n/translations';
import { useUserContext } from '@/providers/UserProvider';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PCGL from '../assets/pcgl-logo.png';
import Button from './button/Button';
import Text from './typography/Text';

const Header = () => {
	const { isLoggedIn } = useUserContext();
	const [lang, setLanguage] = useState(i18n.language);
	const {
		i18n: { t },
	} = useTranslation();

	const languageSwitch = () => {
		clearLangSessionInformation();
		if (lang === SupportedLangs.FRENCH) {
			setLanguage(SupportedLangs.ENGLISH);
			setLangSessionInformation({ lang: SupportedLangs.ENGLISH });
			i18n.changeLanguage(SupportedLangs.ENGLISH);
		} else {
			setLanguage(SupportedLangs.FRENCH);
			setLangSessionInformation({ lang: SupportedLangs.FRENCH });
			i18n.changeLanguage(SupportedLangs.FRENCH);
		}
	};

	return (
		<header className="bg-white py-4 px-6">
			<div className="flex items-center">
				<div className="flex gap-2 flex-1 items-center">
					<img className="w-[150px]" src={PCGL} alt={t('common:pcglLogoAltText')} />
					<div className="flex px-2 gap-2">
						<Text>{t('common:dataSubmission')}</Text>
						<Text>{t('common:dataDictionary')}</Text>
					</div>
				</div>
				<div className="flex justify-end flex-1 gap-2">
					<Button type="secondary" handler={languageSwitch}>
						{t('common:languageSwitch')}
					</Button>
					<Button type="secondary" handler={() => {}}>
						{t('common:helpDesk')}
					</Button>
					<Button href={!isLoggedIn ? API_PATH_LOGIN : API_PATH_LOGOUT}>
						{!isLoggedIn ? t('common:login') : t('common:logout')}
					</Button>
				</div>
			</div>
		</header>
	);
};

export default Header;
