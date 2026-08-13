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

import { Link } from 'react-router';
import HomeIcon from '@/components/icons/HomeIcon';

type Crumb = {
	label: string;
	href?: string;
};

type BreadcrumbsProps = {
	crumbs: Crumb[];
};

const Breadcrumbs = ({ crumbs }: BreadcrumbsProps) => {
	return (
		<nav aria-label="Breadcrumb" className="bg-gray-100 border-b border-gray-200 p-6">
			<ol className="mx-auto flex items-center gap-[0.4rem] flex-wrap list-none m-0 p-0">
				{crumbs.map((crumb, index) => {
					const isLast = index === crumbs.length - 1;
					const isFirst = index === 0;

					return (
						<li key={crumb.label} className="flex items-center gap-[0.4rem]">
							{index > 0 && <span className="text-gray-500 text-sm select-none">/</span>}
							{isLast ? (
								<span className="text-gray-500 text-sm" aria-current="page">
									{crumb.label}
								</span>
							) : crumb.href ? (
								<Link to={crumb.href} className="text-primary-600 no-underline text-sm inline-flex items-center gap-1">
									{isFirst && <HomeIcon />}
									{crumb.label}
								</Link>
							) : (
								<span className="text-gray-500 text-sm">
									{isFirst && <HomeIcon />}
									{crumb.label}
								</span>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
};

export default Breadcrumbs;
