import { ISignInPayload, ISignInResponse, ISignUpPayload } from '../../interface/auth_user.interface';
import api from '../config/api';


const AuthService = {
  async signIn(payload: ISignInPayload): Promise<ISignInResponse> {
    const res = await api.post<ISignInResponse>('/auth/signin', payload);
    return res.data;
  },

  async signUp(payload: ISignUpPayload): Promise<ISignInResponse> {
    const res = await api.post<ISignInResponse>('/auth/signup', payload);
    return res.data;
  },

  async appleSignIn(payload: {
    identityToken: string;
    firstName?: string;
    lastName?: string;
  }): Promise<ISignInResponse> {
    const res = await api.post<ISignInResponse>('/auth/apple', payload);
    return res.data;
  },

  async signOut(token: string): Promise<void> {
    await api.post('/auth/signout', {token});
  },

  async updatePassword(
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ): Promise<void> {
    await api.patch('/auth/update-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/auth/delete-account');
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', {email});
  },

  async resetPassword(accessToken: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', {accessToken, newPassword});
  },
};

export default AuthService;
