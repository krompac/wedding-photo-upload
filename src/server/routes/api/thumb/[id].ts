import { google } from 'googleapis';
import { defineEventHandler, getRouterParam, send } from 'h3';

const credentials = {
  private_key: process.env['GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY']?.replace(
    /\\n/g,
    '\n',
  ),
  client_email: process.env['GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL'],
};

// Auth client
const auth = new google.auth.JWT(
  credentials.client_email,
  undefined,
  credentials.private_key,
  ['https://www.googleapis.com/auth/drive.readonly'],
);

const drive = google.drive({ version: 'v3', auth });

export default defineEventHandler(async (event) => {
  const fileId = getRouterParam(event, 'id');
  if (!fileId) {
    event.node.res.statusCode = 400;
    return { error: 'Missing fileId' };
  }

  try {
    // Fetch thumbnail metadata
    const metaResp = await drive.files.get({
      fileId,
      fields: 'thumbnailLink,thumbnailVersion',
    });
    const { thumbnailLink, thumbnailVersion } = metaResp.data;

    if (!thumbnailLink) {
      event.node.res.statusCode = 404;
      return { error: 'No thumbnail for this file' };
    }

    // Fetch the actual image
    const token = await auth.getAccessToken();
    const imgResp = await fetch(thumbnailLink, {
      headers: { Authorization: `Bearer ${token.token}` },
    });
    if (!imgResp.ok) {
      event.node.res.statusCode = imgResp.status;
      return { error: `Failed to fetch thumbnail (${imgResp.status})` };
    }

    // Stream back with cache headers
    event.node.res.setHeader(
      'Content-Type',
      imgResp.headers.get('content-type') || 'image/jpeg',
    );
    event.node.res.setHeader(
      'Cache-Control',
      'public, max-age=86400, s-maxage=604800', // 1 day browser, 7 days CDN
    );

    // Cache-busting via ?v=thumbnailVersion
    if (thumbnailVersion) {
      event.node.res.setHeader('ETag', `"${thumbnailVersion}"`);
    }

    console.log('hello there');

    const buf = Buffer.from(await imgResp.arrayBuffer());
    return send(event, buf);
  } catch (err: any) {
    console.error('Error fetching thumbnail:', err.message);
    event.node.res.statusCode = 500;
    return { error: 'Failed to fetch thumbnail' };
  }
});
