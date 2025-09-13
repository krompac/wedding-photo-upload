export type PhotoFile = {
  id: string;
  file: File;
  src: string;
  progress?: number;
  status?: 'uploading' | 'success' | 'error';
};
