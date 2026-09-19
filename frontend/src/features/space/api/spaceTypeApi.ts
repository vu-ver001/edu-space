import api from '../../../services/api';
import type { SpaceType, SpaceTypeCreateRequest, SpaceTypeUpdateRequest } from '../types/spaceType';
import type { Space } from '../types/space';

const getAllSpaceTypes = async (): Promise<SpaceType[]> => {
  try {
    const res = await api.get<SpaceType[]>('/api/admin/space-types');
    return res.data;
  } catch {
    const res = await api.get<SpaceType[]>('/api/space-types');
    return res.data;
  }
};

const getSpaceTypeById = async (id: number): Promise<SpaceType> => {
  const res = await api.get<SpaceType>(`/api/admin/space-types/${id}`);
  return res.data;
};

const createSpaceType = async (data: SpaceTypeCreateRequest): Promise<SpaceType> => {
  const res = await api.post<SpaceType>('/api/admin/space-types', data);
  return res.data;
};

const updateSpaceType = async (id: number, data: SpaceTypeUpdateRequest): Promise<SpaceType> => {
  const res = await api.put<SpaceType>(`/api/admin/space-types/${id}`, data);
  return res.data;
};

const deleteSpaceType = async (id: number): Promise<void> => {
  await api.delete(`/api/admin/space-types/${id}`);
};

const getAllSpaces = async (): Promise<Space[]> => {
  const res = await api.get<Space[]>('/api/spaces');
  return res.data;
};

export const spaceTypeApi = {
  getAllSpaceTypes,
  getAll: getAllSpaceTypes,
  getSpaceTypeById,
  getById: getSpaceTypeById,
  createSpaceType,
  create: createSpaceType,
  updateSpaceType,
  update: updateSpaceType,
  deleteSpaceType,
  delete: deleteSpaceType,
  getAllSpaces,
};
