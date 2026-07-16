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

import { clearLangSessionInformation, setLangSessionInformation, SupportedLangs } from '@/global/localstorage/language';
import i18n from '@/i18n/translations';
import { Theme, useTheme } from '@/styles/theme';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PCGL from '../assets/pcgl-logo.png';
import Button from './button/Button';
import Text from './typography/Text';

const headerTop = (theme: Theme): React.CSSProperties => ({
	backgroundColor: theme.colors.background.default,
	padding: `${theme.spacing.md} ${theme.spacing.lg}`,
});

const headerBody = (): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
});

const headerImage = (): React.CSSProperties => ({
	width: '150px',
});

const Header = () => {
	const { theme } = useTheme();
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
		<header style={headerTop(theme)}>
			<div style={headerBody()}>
				<div style={{ display: 'flex', gap: theme.spacing.sm, flex: 1, alignItems: 'center' }}>
					<img style={headerImage()} src={PCGL} alt={t('common:pcglLogoAltText')} />
					<Text>{t('common:dataSubmission')}</Text>
					<Text>{t('common:dataDictionary')}</Text>
				</div>
				<div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
					<Button defaultText={t('common:languageSwitch')} handler={languageSwitch} />
				</div>
			</div>
		</header>
	);
};

export default Header;
