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

import CIHRLogo from '@/assets/cihr-logo.png';
import PCGLLogoWhite from '@/assets/pcgl-logo-white.png';
import { useTranslation } from 'react-i18next';

const Footer = () => {
	const {
		i18n: { t },
	} = useTranslation('common');
	const currentDate = new Date().getFullYear();

	return (
		<footer className="bg-primary-400 text-white w-full p-8">
			<div className="flex flex-col md:flex-row justify-between gap-12">
				{/* Left Section - Logos and Text */}
				<div className="flex-1 flex flex-col gap-4">
					<div className="flex gap-6 items-center">
						<img src={PCGLLogoWhite} alt="PCGL Logo" className="h-[40px] object-contain" />
						<img src={CIHRLogo} alt="CIHR Logo" className="h-[40px] object-contain" />
					</div>
					<p className="text-white text-sm leading-normal">{t('common:footer.supportedBy')}</p>
					<p className="text-white text-sm leading-normal">{t('common:footer.copyright', { date: currentDate })}</p>
				</div>

				{/* Right Section - Links */}
				<div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
					{/* Column 1 */}
					<div className="flex flex-col gap-6">
						<a href="#contact" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.contactUs')}
						</a>
						<a href="#controlled-users" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.controlledDataUsers')}
						</a>
						<a href="#privacy" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.privacyPolicy')}
						</a>
					</div>

					{/* Column 2 */}
					<div className="flex flex-col gap-6">
						<a href="#policies" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.policiesGuidelines')}
						</a>
						<a href="#website" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.pcglWebsite')}
						</a>
						<a href="#terms" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.termsConditions')}
						</a>
					</div>

					{/* Column 3 */}
					<div className="flex flex-col gap-6">
						<a href="#help" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.helpGuides')}
						</a>
						<a href="#platform" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.dataPlatform')}
						</a>
						<a href="#publication" className="text-white underline text-sm cursor-pointer">
							{t('common:footer.publicationPolicy')}
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
