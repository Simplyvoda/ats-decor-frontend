import api from '../config/api';

export interface IUpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
}

export interface IGetProfileResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
}

const UserService = {
  async getProfile(): Promise<IGetProfileResponse> {
    const res = await api.get<IGetProfileResponse>('/users/profile');
    return res.data;
  },

  async updateProfile(payload: IUpdateProfilePayload): Promise<IGetProfileResponse> {
    const res = await api.put<IGetProfileResponse>('/users/profile', payload);
    return res.data;
  },
};

export default UserService;
