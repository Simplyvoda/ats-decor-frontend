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
};

export default AuthService;
