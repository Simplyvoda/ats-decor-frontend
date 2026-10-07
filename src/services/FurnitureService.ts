import api from '../config/api';
import {IFurnitureResponse} from '../../interface/furniture.interface';

// The catalogue is the same for every user and changes rarely, so it is
// fetched once and reused for a while instead of on every viewer open.
const CACHE_MS = 10 * 60 * 1000;
let cached: {at: number; value: IFurnitureResponse} | null = null;
let inFlight: Promise<IFurnitureResponse> | null = null;

const FurnitureService = {
  async getFurniture(): Promise<IFurnitureResponse> {
    if (cached && Date.now() - cached.at < CACHE_MS) {
      return cached.value;
    }
    if (!inFlight) {
      inFlight = api
        .get('/furniture')
        .then(res => {
          cached = {at: Date.now(), value: res.data};
          return res.data as IFurnitureResponse;
        })
        .finally(() => {
          inFlight = null;
        });
    }
    return inFlight;
  },
};

export default FurnitureService;
