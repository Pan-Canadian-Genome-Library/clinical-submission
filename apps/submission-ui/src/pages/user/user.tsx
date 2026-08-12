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

import { API_PATH_LOGOUT } from '@/api/paths';
import { useUserContext } from '@/providers/UserProvider';

// NOTE: temporary page. Will change.
const UserPage = () => {
	const { isLoading, user, isLoggedIn } = useUserContext();

	if (isLoading) {
		return (
			<div style={{ padding: '2rem' }}>
				<p>Loading user information...</p>
			</div>
		);
	}

	if (!isLoggedIn || !user) {
		return (
			<div style={{ padding: '2rem' }}>
				<p>You are not logged in. Please log in to view your profile.</p>
			</div>
		);
	}

	return (
		<div style={{ padding: '2rem', maxWidth: '800px' }}>
			<h1>User Profile</h1>

			{/* User Name */}
			<section style={{ marginBottom: '2rem' }}>
				<h2>Personal Information</h2>
				<div>
					<strong>Name:</strong>{' '}
					{user.givenName || user.familyName
						? `${user.givenName || ''} ${user.familyName || ''}`.trim()
						: 'Not provided'}
				</div>
				<div>
					<strong>User ID:</strong> {user.userId}
				</div>
			</section>

			{/* Email Addresses */}
			<section style={{ marginBottom: '2rem' }}>
				<h2>Email Addresses</h2>
				{user.emails && user.emails.length > 0 ? (
					<ul>
						{user.emails.map((email, index) => (
							<li key={index}>{email.address}</li>
						))}
					</ul>
				) : (
					<p>No email addresses</p>
				)}
			</section>

			{/* Admin Status */}
			<section style={{ marginBottom: '2rem' }}>
				<h2>Admin Status</h2>
				<div>
					<strong>Site Administrator:</strong> {user.siteAdmin ? 'Yes' : 'No'}
				</div>
				<div>
					<strong>Data Administrator:</strong> {user.dataAdmin ? 'Yes' : 'No'}
				</div>
			</section>

			{/* Groups */}
			<section style={{ marginBottom: '2rem' }}>
				<h2>Groups</h2>
				{user.groups && user.groups.length > 0 ? (
					<ul>
						{user.groups.map((group) => (
							<li key={group.id}>
								<strong>{group.name}</strong>
								{group.description && ` - ${group.description}`}
							</li>
						))}
					</ul>
				) : (
					<p>No groups assigned</p>
				)}
			</section>
			<div>
				<a href={API_PATH_LOGOUT}>Logout</a>
			</div>
		</div>
	);
};

export default UserPage;
