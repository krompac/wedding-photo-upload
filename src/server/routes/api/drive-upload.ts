// src/server/routes/api/drive-upload.ts
import fs from 'fs';
import { google } from 'googleapis';
import { defineEventHandler, readMultipartFormData } from 'h3';
import path from 'path';
import { Readable } from 'stream';

// Load service account credentials
const CREDENTIALS_PATH = path.join(
  process.cwd(),
  'service-account-credentials.json'
);
const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));

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
