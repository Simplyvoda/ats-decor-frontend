import api from '../config/api';
import {IDesignTemplatesResponse} from '../../interface/design-template.interface';

const DesignTemplateService = {
  async getTemplates(): Promise<IDesignTemplatesResponse> {
    const res = await api.get('/design-templates');
    return res.data;
  },
};

export default DesignTemplateService;
