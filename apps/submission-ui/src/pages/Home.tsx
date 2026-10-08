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

import AuditIcon from '@/assets/audit-outlined.png';
import FileIcon from '@/assets/file-outlined.png';
import Hero from '@/assets/hero-bar.jpg';
import SignatureIcon from '@/assets/signature-outlined.png';
import UserIcon from '@/assets/user-outlined.png';
import Button from '@/components/button/Button';
import PageLayout from '@/components/layouts/PageLayout';
import SectionLayout from '@/components/layouts/SectionLayout';
import Text from '@/components/typography/Text';
import { useTranslation } from 'react-i18next';

function Home() {
	const {
		i18n: { t },
	} = useTranslation();

	return (
		<PageLayout>
			{/* Hero Section */}
			<section
				className="bg-center bg-cover py-16 px-8 min-h-100 flex justify-center items-center"
				style={{ backgroundImage: `url(${Hero})` }}
			>
				<div className="max-w-300 w-full mx-auto">
					<h1 className="text-white font-jost text-4xl mb-4 font-semibold max-w-162.5">{t('common:hero.title')}</h1>
					<p className="text-white mb-8 max-w-150">{t('common:hero.description')}</p>
					<div className="flex gap-4 items-center mt-6">
						<Button type="secondary" handler={() => {}}>
							{t('common:hero.submitFiles')}
						</Button>
					</div>
				</div>
			</section>

			<SectionLayout className="bg-white py-12">
				{/* Content Section */}
				<div className="max-w-300 mx-auto">
					<div className="flex flex-col md:flex-row gap-12 mb-12">
						{/* Overview Section */}
						<div className="flex-1">
							<h2 className="text-gray-900 font-jost text-2xl mb-4 font-semibold">{t('common:overview.title')}</h2>
							<Text className="mb-4">{t('common:overview.paragraph1')}</Text>
							<Text>{t('common:overview.paragraph2')}</Text>
						</div>

						{/* How to Register Section */}
						<div className="flex-1">
							<h2 className="text-gray-900 font-jost text-2xl mb-6 font-semibold">{t('common:howToRegister.title')}</h2>

							{/* Step 1 */}
							<div className="flex gap-4 mb-6 items-start">
								<div
									className="w-12.5 h-12.5 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
									style={{ backgroundColor: '#E8A4A2' }}
								>
									<img src={SignatureIcon} alt="" className="w-6 h-6 object-contain" />
								</div>
								<Text>
									<a href="#helpdesk" className="text-primary-600 underline">
										{t('common:howToRegister.step1.linkText')}
									</a>{' '}
									{t('common:howToRegister.step1.text')}
								</Text>
							</div>

							{/* Step 2 */}
							<div className="flex gap-4 mb-6 items-start">
								<div
									className="w-12.5 h-12.5 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
									style={{ backgroundColor: '#A8D5BA' }}
								>
									<img src={AuditIcon} alt="" className="w-6 h-6 object-contain" />
								</div>
								<Text>{t('common:howToRegister.step2')}</Text>
							</div>

							{/* Step 3 */}
							<div className="flex gap-4 mb-6 items-start">
								<div
									className="w-12.5 h-12.5 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
									style={{ backgroundColor: '#F4D35E' }}
								>
									<img src={UserIcon} alt="" className="w-6 h-6 object-contain" />
								</div>
								<Text>{t('common:howToRegister.step3')}</Text>
							</div>

							{/* Step 4 */}
							<div className="flex gap-4 mb-6 items-start">
								<div
									className="w-12.5 h-12.5 rounded-full flex items-center justify-center shrink-0 text-white font-bold"
									style={{ backgroundColor: '#A4C2E4' }}
								>
									<img src={FileIcon} alt="" className="w-6 h-6 object-contain" />
								</div>
								<Text>{t('common:howToRegister.step4')}</Text>
							</div>
						</div>
					</div>
				</div>
			</SectionLayout>

			{/* Submitting Genomic Data Section */}
			<SectionLayout className="py-12">
				<section className="py-12">
					<div className="max-w-300 mx-auto">
						<h2 className="text-gray-900 font-jost text-2xl mb-4 font-semibold">{t('common:genomicData.title')}</h2>
						<Text>{t('common:genomicData.paragraph')}</Text>
						<a href="#workflow" className="text-primary-600 underline text-base">
							{t('common:genomicData.linkText')} →
						</a>
					</div>
				</section>
			</SectionLayout>
		</PageLayout>
	);
}

export default Home;
