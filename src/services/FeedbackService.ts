import api from '../config/api';

const FeedbackService = {
  async send(message: string): Promise<void> {
    await api.post('/feedback', {message});
  },
};

export default FeedbackService;
