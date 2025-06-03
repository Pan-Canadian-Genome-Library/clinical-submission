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

import { isValidIDNumber } from "@/common/utils/utils.js";
import { lyricProvider } from "@/core/provider.js";
import { getDbInstance } from "@/db/index.js";
import {
  type RequestValidation,
  validateRequest,
} from "@/middleware/requestValidation.js";
import { studyService } from "@/services/studyService.js";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import { z } from "zod";

interface GetStudyParams extends ParamsDictionary {
  studyId: string;
}

export const getStudyData: RequestValidation<
  { organization: string },
  ParsedQs,
  GetStudyParams
> = {
  pathParams: z.object({
    studyId: z.string(),
  }),
};

export const getStudyById = validateRequest(getStudyData, async (req, res) => {
  const studyId = req.params.studyId;
  const db = getDbInstance();
  const studyRepo = studyService(db);

  if (!studyId || !studyId.length) {
    throw new lyricProvider.utils.errors.BadRequest(
      "Study ID must be included in path and must be a valid string."
    );
  }

  try {
    const results = await studyRepo.getStudyById(studyId);
    res.status(200).send(results);
    return;
  } catch (exception) {
    throw exception;
  }
});
