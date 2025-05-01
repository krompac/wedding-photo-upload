// src/server/routes/api/drive-upload.ts
import { google } from 'googleapis';
import { defineEventHandler, readMultipartFormData } from 'h3';
import { Readable } from 'stream';

const credentials = {
  type: process.env['GOOGLE_SERVICE_ACCOUNT_TYPE'] || 'service_account',
  project_id: process.env['GOOGLE_SERVICE_ACCOUNT_PROJECT_ID'],
  private_key_id: process.env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID'],
  private_key: process.env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY']?.replace(
    /\\n/g,
    '\n'
  ),
  client_email: process.env['GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL'],
  client_id: process.env['GOOGLE_SERVICE_ACCOUNT_CLIENT_ID'],
  auth_uri:
    process.env['GOOGLE_SERVICE_ACCOUNT_AUTH_URI'] ||
    'https://accounts.google.com/o/oauth2/auth',
  token_uri:
    process.env['GOOGLE_SERVICE_ACCOUNT_TOKEN_URI'] ||
    'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:
    process.env['GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL'] ||
    'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env['GOOGLE_SERVICE_ACCOUNT_CLIENT_CERT_URL'],
  universe_domain:
    process.env['GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN'] || 'googleapis.com',
};

// Create JWT client
const auth = new google.auth.JWT(
  credentials.client_email,
  undefined,
  credentials.private_key,
  ['https://www.googleapis.com/auth/drive']
);

// Create Drive client
const drive = google.drive({ version: 'v3', auth });

// Folder ID where files will be uploaded
const FOLDER_ID = process.env['GOOGLE_DRIVE_FOLDER_ID'];

export default defineEventHandler(async (event) => {
  try {
    // Parse the multipart form data (file upload)
    const data = await readMultipartFormData(event);

    if (!data || data.length === 0) {
      return {
        status: 400,
        body: { error: 'No file uploaded' },
      };
    }

    // Get the file data from the form
    const fileData = data.find((part) => part.name === 'file');

    if (!fileData) {
      return {
        status: 400,
        body: { error: 'File part not found in upload' },
      };
    }

    // Get filename from the form or use a default name
    const filenameData = data.find((part) => part.name === 'filename');
    const filename = filenameData
      ? filenameData.data.toString()
      : fileData.filename || 'uploaded-file';

    // Create file metadata
    const fileMetadata = {
      name: filename,
      parents: [FOLDER_ID],
    };

    // Convert buffer to stream
    const fileStream = new Readable();
    fileStream.push(fileData.data);
    fileStream.push(null);

    // Upload the file directly to Google Drive
    const response = await drive.files.create({
      requestBody: fileMetadata as any,
      media: {
        mimeType: fileData.type || 'application/octet-stream',
        body: fileStream,
      },
      fields: 'id,name,webViewLink',
    });

    return {
      status: 200,
      body: {
        fileId: response.data.id,
        fileName: response.data.name,
        viewLink: response.data.webViewLink,
        message: 'File uploaded successfully',
      },
    };
  } catch (error: any) {
    console.error('Error uploading file:', error);
    console.error('Folder ID being used:', FOLDER_ID);
    console.error('Service account email:', auth.email);

    return {
      status: 500,
      body: {
        error: 'Failed to upload file',
        details: error.message,
      },
    };
  }
});
