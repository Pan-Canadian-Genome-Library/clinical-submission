/* eslint-disable react-refresh/only-export-components */
/*
 * Copyright (c) 2025 The Ontario Institute for Cancer Research. All rights reserved
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

import { ThemeProvider } from '@overture-stack/lectern-ui';

export const pcglColours = {
	// Main Colors
	primary: '#C41D7F',
	secondary: '#520339',
	tertiary: '#FFF0F6',
	quaternary: '#FFD6E7',
	grey: '#d9d9d99e',
	alternateRow: '#FFF7FB',
	darkGrey: 'rgba(0, 0, 0, 0.45)',
	black: '#000000',
	white: '#FFFFFF',
};

const PCGLThemeProvider = ({ children }: { children: React.ReactElement }) => {
	return (
		<ThemeProvider
			theme={{
				colors: {
					background_overlay: pcglColours.darkGrey, // Modal background color
					accent: pcglColours.primary, // Modal title color
					accent_1: pcglColours.tertiary, // Button hover
					accent_dark: pcglColours.black, // Title color
					background_alternate: pcglColours.alternateRow,
					background_muted: pcglColours.grey, // Col box
				},
			}}
		>
			{children}
		</ThemeProvider>
	);
};

export default PCGLThemeProvider;
