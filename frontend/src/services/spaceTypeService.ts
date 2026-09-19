// ========================================================
// Re-export for backward compatibility
// New canonical location: src/features/space/api/spaceTypeApi.ts
// ========================================================

import { spaceTypeApi } from '../features/space/api/spaceTypeApi';
import type { Space } from './spaceService';
import type {
  SpaceType,
  SpaceTypeCreateRequest,
  SpaceTypeUpdateRequest,
  BookingMode,
} from '../features/space/types/spaceType';

export type { SpaceType, SpaceTypeCreateRequest, SpaceTypeUpdateRequest, BookingMode };

export const spaceTypeService = {
  getAllSpaceTypes: spaceTypeApi.getAll,
  getSpaceTypeById: spaceTypeApi.getById,
  createSpaceType: spaceTypeApi.create,
  updateSpaceType: spaceTypeApi.update,
  deleteSpaceType: spaceTypeApi.delete,
  getAllSpaces: spaceTypeApi.getAllSpaces as () => Promise<Space[]>,
};
