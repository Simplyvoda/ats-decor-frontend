import api from '../config/api';

export interface IUserProfile {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  bio: string | null;
  profile_picture: string | null;
  design_style: string | null;
  marketing_emails: boolean;
  date_joined: string;
}

export interface IUserProfileResponse {
  status: string;
  message: string;
  data: IUserProfile;
}

export interface IUpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  bio?: string;
  profile_picture?: string;
  design_style?: string;
  marketing_emails?: boolean;
}

const UserService = {
  async getProfile(): Promise<IUserProfileResponse> {
    const res = await api.get('/user');
    return res.data;
  },

  async updateProfile(
    payload: IUpdateProfilePayload,
  ): Promise<IUserProfileResponse> {
    const res = await api.put('/user', payload);
    return res.data;
  },
};

export default UserService;
