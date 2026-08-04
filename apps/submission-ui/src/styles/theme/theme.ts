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

export const theme = {
	colors: {
		primary: {
			darkest: '#054A74',
			darker: '#155680',
			dark: '#1F6592',
			main: '#2B7AAD',
			light: '#4794C6',
			lighter: '#60AADB',
		},
		secondary: {
			teal: '#25BEA2',
			blue: '#3D7EA5',
			pink: '#DFC7C5',
			black: '#000000',
			main: '#25BEA2',
		},
		error: {
			main: '#EC1C24',
			light: '#F4A1A4',
		},
		warning: {
			main: '#FADB14',
			light: '#FFFB88',
		},
		success: {
			main: '#52C41A',
			light: '#D9F7BE',
		},
		background: {
			default: '#ffffff',
			grey: '#f5f5f5',
		},
		text: {
			primary: '#212121',
			secondary: '#666666',
			white: '#ffffff',
		},
		border: {
			primary: '#e0e0e0',
		},
	},
	shadows: {
		level1: '0 2px 8px rgba(0, 0, 0, 0.08)',
		level2: '0 4px 16px rgba(0, 0, 0, 0.12)',
	},
	typography: {
		fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
		fontSize: {
			xs: '0.75rem',
			sm: '0.875rem',
			base: '1rem',
			lg: '1.125rem',
			xl: '1.5rem',
			xxl: '1.875rem',
		},
		fontWeight: {
			regular: 400,
			bold: 600,
		},
		lineHeight: {
			normal: 1.5,
			relaxed: 1.75,
		},
	},
	spacing: {
		sm: '0.5rem',
		md: '1rem',
		lg: '1.5rem',
		xxl: '4rem',
	},
};

export type Theme = typeof theme;
