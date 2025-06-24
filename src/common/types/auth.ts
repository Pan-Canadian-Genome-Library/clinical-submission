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

/**
 * JWT Token returned by CILogon on successful authentication. Note that some
 * members may not be returned depending on the IDP used.
 */
export interface CILogonToken {
	/**
	 * Subject, the ID of the CI Logon user.
	 */
	sub: string;
	/**
	 * Identity Provider Name
	 */
	idp_name: string;
	/**
	 * Authentication Methods Array (not returned by all IDP)
	 */
	amr?: string;
	/**
	 * Authentication Context Class (not returned by all IDP)
	 */
	acr?: string;
	/**
	 * eduPersonPrincipalName (returned by federated uni/college logins)
	 * @see: https://www.educause.edu/fidm/attributes & https://www.canarie.ca/identity/fim/
	 */
	eppn?: string;
	/**
	 * eduPersonTargetedID (returned by federated uni/college logins).
	 * @see: https://www.educause.edu/fidm/attributes & https://www.canarie.ca/identity/fim/
	 */
	eptid?: string;
	/**
	 * Issuer, will always be CILogon
	 */
	iss: string;
	/**
	 * User's given name, usually the same as `name`
	 */
	given_name: string;
	/**
	 * Audience - the recipients that the JWT is intended for.
	 */
	aud: string;
	/**
	 * Time from Unix Epoch - Not valid before.
	 */
	nbf: number;
	/**
	 * The unique identifier for IDP the user used to login.
	 * Usually a URL
	 */
	idp: string;
	/**
	 * Time from Unix Epoch - When the user authenticated
	 */
	auth_time: number;
	/**
	 * The User's name
	 */
	name: string;
	/**
	 * Time from Unix Epoch - When the token expires.
	 */
	exp: number;
	/**
	 * The user's Family (last) name
	 */
	family_name: string;
	/**
	 * Time from Unix Epoch - When the token was issued at.
	 */
	iat: number;
	/**
	 * Unique ID of the JWT issued.
	 */
	jti: string;
	/**
	 * User's Email -  not returned by all IDP.
	 */
	email?: string;
	/**
	 * The user's affiliated roles, not returned by all IDP (returned by federated uni/college logins).
	 *
	 * Specifies the the user in broad categories such as student, faculty, staff, alum, etc.
	 * @see: https://www.educause.edu/fidm/attributes & https://www.canarie.ca/identity/fim/
	 */
	affiliation?: string;
}
