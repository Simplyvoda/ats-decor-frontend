import api from '../config/api';
import { IUpdateProfilePayload, IGetProfileResponse } from '../../interface/user_profile.interface';

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
