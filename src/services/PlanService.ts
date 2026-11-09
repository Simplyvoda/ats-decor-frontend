import api from '../config/api';
import {IPlanRow, IUsage} from '../../interface/plan.interface';

const PlanService = {
  // Every plan and its limits (for the plan cards)
  async getPlans(): Promise<IPlanRow[]> {
    const res = await api.get('/billing/plans');
    return res.data.data;
  },

  // The user's plan and how much of each limit they've used
  async getUsage(): Promise<IUsage> {
    const res = await api.get('/billing/usage');
    return res.data.data;
  },

  // After a purchase or restore: the server checks RevenueCat and updates
  // the plan straight away. Returns the new usage.
  async syncPurchases(): Promise<IUsage> {
    const res = await api.post('/billing/sync');
    return res.data.data;
  },
};

export default PlanService;
