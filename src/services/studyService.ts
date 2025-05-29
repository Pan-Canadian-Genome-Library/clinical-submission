import { logger } from "@/common/logger.js";
import { PostgresDb } from "@/db/index.js";
import { study } from "@/db/schemas/studiesSchema.js";
import {
  InternalServerError,
  NotFound,
} from "@overture-stack/lyric/dist/src/utils/errors.js";
import { eq } from "drizzle-orm";

const studyService = (db: PostgresDb) => ({
  getStudyById: async (studyId: number) => {
    let studyRecords;
    try {
      studyRecords = await db
        .select()
        .from(study)
        .where(eq(study.study_id, studyId));
    } catch (exception) {
      logger.error("Error at getStudyById", exception);

      throw new InternalServerError(
        "Something went wrong while fetching studies."
      );
    }
    if (studyRecords[0]) {
      return studyRecords;
    } else {
      throw new NotFound(`No study with studyId - ${studyId} found.`);
    }
  },
});

export { studyService };
