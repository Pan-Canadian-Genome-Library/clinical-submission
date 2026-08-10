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

type ButtonProps = {
	children?: React.ReactNode;
	defaultText: string;
	handler?: () => void;
	type?: 'primary' | 'secondary';
	href?: string;
	className?: string;
};

/**
 * A button component that supports both text and children content.
 * If a children prop is provided, it will be used instead of the default text.
 * @param props
 * @returns
 */
const Button = (props: ButtonProps) => {
	const isPrimary = (props.type ?? 'primary') === 'primary';

	const baseClasses = isPrimary
		? 'bg-primary-800 hover:bg-primary-700 text-white font-semibold rounded-lg px-2 py-1 cursor-pointer transition-colors duration-300 text-sm'
		: 'bg-white hover:bg-gray-100 text-black font-semibold rounded-lg px-2 py-1 cursor-pointer transition-colors duration-300 text-sm border border-gray-200';

	const content = props.children ?? props.defaultText;

	if (props.href) {
		return (
			<a
				href={props.href}
				className={`${baseClasses} no-underline inline-block${props.className ? ` ${props.className}` : ''}`}
				{...(props.handler ? { onClick: props.handler } : {})}
			>
				{content}
			</a>
		);
	}

	return (
		<button
			className={`${baseClasses}${props.className ? ` ${props.className}` : ''}`}
			{...(props.handler ? { onClick: props.handler } : {})}
		>
			{content}
		</button>
	);
};

export default Button;
