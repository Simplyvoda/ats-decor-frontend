import api from '../config/api';
import {setFoundingMember} from './analytics';

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
  first_login_completed: boolean;
  first_scan_completed: boolean;
  room_data_consent_at: string | null;
  // 'apple' = signed in with Apple (deleting the account also revokes it)
  sso_type?: 'google' | 'facebook' | 'apple' | null;
  // Founding member (first 250 on the Kit list). Analytics only; not shown
  founding_member?: boolean;
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
  first_login_completed?: boolean;
  first_scan_completed?: boolean;
  room_data_consent?: boolean;
}

const UserService = {
  async getProfile(): Promise<IUserProfileResponse> {
    const res = await api.get('/user');
    // Keep the analytics cohort in step with the account
    if (typeof res.data?.data?.founding_member === 'boolean') {
      setFoundingMember(res.data.data.founding_member);
    }
    return res.data;
  },

  async updateProfile(
    payload: IUpdateProfilePayload,
  ): Promise<IUserProfileResponse> {
    const res = await api.put('/user', payload);
    return res.data;
  },

  async uploadProfilePicture(
    fileUri: string,
    mimeType: string,
  ): Promise<IUserProfileResponse> {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: mimeType,
      name: `profile-picture.${mimeType.split('/')[1] || 'jpg'}`,
    } as any);

    const res = await api.post('/user/profile-picture', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return res.data;
  },
};

export default UserService;
