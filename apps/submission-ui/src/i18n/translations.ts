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

import { getLangSessionInformation, SupportedLangs } from '@/global/localstorage/language';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enForm from '@/i18n/locales/en/enForm.json';
import enGeneral from '@/i18n/locales/en/enGeneral.json';
import enHome from '@/i18n/locales/en/enHome.json';
import frForm from '@/i18n/locales/fr/frForm.json';
import frGeneral from '@/i18n/locales/fr/frGeneral.json';
import frHome from '@/i18n/locales/fr/frHome.json';

const { lang } = getLangSessionInformation();

export const defaultNS = 'common';
export const resources = {
	en: {
		[defaultNS]: {
			...enForm,
			...enGeneral,
			...enHome,
		},
	},
	fr: {
		[defaultNS]: {
			...frForm,
			...frGeneral,
			...frHome,
		},
	},
};

i18n.use(initReactI18next).init({
	resources,
	lng: lang,
	defaultNS,
	fallbackNS: defaultNS,
	fallbackLng: SupportedLangs.ENGLISH,
	returnEmptyString: false,
	supportedLngs: ['en', 'fr'],
	interpolation: {
		escapeValue: false,
	},
	ns: ['en', 'fr'],
});

export default i18n;
