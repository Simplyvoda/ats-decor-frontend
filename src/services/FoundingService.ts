import api from '../config/api';

// Founding members (the first 250 confirmed sign-ups on the Kit form).
// Most are recognised automatically by email; anyone whose email differs
// (e.g. Sign in with Apple with a hidden email) claims with their code.
const FoundingService = {
  async claim(code: string): Promise<void> {
    await api.post('/founding-members/claim', {code});
  },
};

export default FoundingService;
