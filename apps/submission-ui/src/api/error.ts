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
export const withErrorResponseHandler = (response: Response) => {
	if (response.ok) {
		return response;
	} else {
		const error = {
			message: 'Error',
			error: 'An error occurred',
		};

		switch (response.status) {
			case 400:
				error.message = 'Bad Request';
				error.error = 'The request was invalid';
				break;
			case 403:
				error.message = 'Forbidden';
				error.error = 'You do not have permission to access this resource';
				break;
			case 404:
				error.message = 'Not Found';
				error.error = 'The requested resource was not found';
				break;
			case 500:
				error.message = 'Server Error';
				error.error = 'An internal server error occurred';
				break;
			default:
				error.message = 'Request Failed';
				error.error = 'Failed to fetch data from the server';
		}

		throw error;
	}
};
