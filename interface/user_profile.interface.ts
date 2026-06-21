export interface IUpdateProfilePayload {
  first_name?: string;
  last_name?: string;
  email?: string;
  bio?: string;
  design_style?: string;
}

export interface IGetProfileResponse {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  design_style?: string;
}
