export interface INoteTag {
  id: string;
  name: string;
}

export interface INoteAttachment {
  id: string;
  url: string;
}

export interface INote {
  id: string;
  title: string;
  description: string;
  is_private: boolean;
  is_deleted: boolean;
  project_id: string | null;
  tags: INoteTag[];
  attachments: INoteAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface INotesResponse {
  status: string;
  message: string;
  data: INote[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface INoteResponse {
  status: string;
  message: string;
  data: INote;
}

export interface ICreateNotePayload {
  title: string;
  description?: string;
  is_private?: boolean;
  project_id?: string;
  tags?: string[];
  attachments?: string[];
}

// A note held locally (AsyncStorage) until the design it belongs to is
// saved and gets a real project id — see NoteService's draft methods.
export interface IDraftNote {
  localId: string;
  title: string;
  description: string;
  is_private: boolean;
  project_id: string | null;
  tags: string[];
  createdAt: string;
}
