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

import { logger } from "@/common/logger.js";
import { lyricProvider } from "@/core/provider.js";
import { PostgresDb } from "@/db/index.js";
import { study } from "@/db/schemas/studiesSchema.js";
import { eq } from "drizzle-orm";

const studyService = (db: PostgresDb) => ({
  getStudyById: async (studyId: string) => {
    let studyRecords;
    try {
      studyRecords = await db
        .select({
          studyId: study.study_id,
          dacId: study.dac_id,
          studyName: study.study_name,
          studyDescription: study.study_description,
          programName: study.program_name,
          status: study.status,
          context: study.context,
          domain: study.domain,
          participantCriteria: study.participant_criteria,
          principalInvestigators: study.principal_investigators,
          leadOrganizations: study.lead_organizations,
          collaborator: study.collaborator,
          fundingSources: study.funding_sources,
          publicationLinks: study.publication_links,
          createdAt: study.created_at,
          updatedAt: study.updated_at,
        })
        .from(study)
        .where(eq(study.study_id, studyId));
    } catch (exception) {
      logger.error("Error at getStudyById", exception);
      throw new lyricProvider.utils.errors.ServiceUnavailable(
        "Something went wrong while fetching studies. Please try again later."
      );
    }
    return studyRecords[0];
  },
});

export { studyService };
