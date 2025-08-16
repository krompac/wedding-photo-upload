export type PhotoFile = {
  id: string;
  file: File;
  src: string;
  status?: 'uploading' | 'success' | 'error';
};
