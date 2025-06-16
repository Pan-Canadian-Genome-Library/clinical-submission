import { logger } from '@/common/logger.js';
import { DACFields } from '@/common/types/dac.js';
import { CreateDacDataFields, UpdateDacDataFields } from '@/common/validation/dac-validation.js';
import { lyricProvider } from '@/core/provider.js';
import { getDbInstance } from '@/db/index.js';
import dacRepository from '@/repository/dacRepository.js';

const dacService = () => {
	return {
		getAllDac: async (orderBy?: string, page?: number, pageSize?: number): Promise<DACFields[]> => {
			const db = getDbInstance();
			const dacRepo = dacRepository(db);

			const result = await dacRepo.listAllDac({
				orderBy: orderBy,
				page: Number(page),
				pageSize: Number(pageSize),
			});

			return result;
		},
		getDacById: async (dacId: string): Promise<DACFields | undefined> => {
			const database = getDbInstance();
			const dacRepo = await dacRepository(database);

			const result = await dacRepo.getDacById(dacId);

			if (!result) {
				const message = `No dac with dacId - ${dacId} found.`;
				logger.error(message);
				throw new lyricProvider.utils.errors.NotFound(message);
			}

			return result;
		},
		createDac: async (dacFields: CreateDacDataFields): Promise<DACFields | undefined> => {
			const database = getDbInstance();
			const dacRepo = await dacRepository(database);

			const result = await dacRepo.saveDac(dacFields);

			return result;
		},
		deleteDac: async (dacId: string): Promise<Pick<DACFields, 'dacId'> | undefined> => {
			const database = getDbInstance();
			const dacRepo = await dacRepository(database);

			const result = await dacRepo.deleteDacById(dacId);

			if (!result) {
				const message = `No dac with dacId - ${dacId} found to delete.`;
				logger.error(message);
				throw new lyricProvider.utils.errors.NotFound(message);
			}

			return result;
		},
		updateDac: async (dacId: string, dacFields: UpdateDacDataFields): Promise<DACFields | undefined> => {
			const database = getDbInstance();
			const dacSvc = await dacRepository(database);

			const result = await dacSvc.updateDacById(dacId, dacFields);

			if (!result) {
				const message = `No dac with ID ${dacId} found to update.`;
				logger.error(message);
				throw new lyricProvider.utils.errors.NotFound(message);
			}

			return result;
		},
	};
};

export default dacService;
