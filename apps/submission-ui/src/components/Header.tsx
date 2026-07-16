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
import PCGL from '../assets/pcgl-logo-colour.svg';
import Button from './button/Button';

const headerTop = (theme: Theme): React.CSSProperties => ({
	padding: `${theme.spacing.md} ${theme.spacing.xxl}`,
});

const headerBody = (): React.CSSProperties => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
});

const headerImage = (): React.CSSProperties => ({
	width: '250px',
});

const Header = () => {
	const { theme } = useTheme();
	const [lang, setLanguage] = useState(i18n.language);

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
				<img style={headerImage()} src={PCGL} alt="PCGL Clinical Submission Home" />
				<>
					<Button
						defaultText={i18n.language === SupportedLangs.FRENCH ? 'English' : 'French'}
						handler={languageSwitch}
					/>
					<h2>Submission UI</h2>
				</>
			</div>
		</header>
	);
};

export default Header;
