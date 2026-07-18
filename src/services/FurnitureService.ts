import api from '../config/api';
import {IFurnitureResponse} from '../../interface/furniture.interface';

const FurnitureService = {
  async getFurniture(): Promise<IFurnitureResponse> {
    const res = await api.get('/furniture');
    return res.data;
  },
};

export default FurnitureService;
