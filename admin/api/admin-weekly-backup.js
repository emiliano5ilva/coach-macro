import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';
import { Readable } from 'stream';

const sb = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BACKUP_FOLDER_ID = process.env.GOOGLE_DRIVE_BACKUP_FOLDER;

const getDrive = () => {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return google.drive({ version: 'v3', auth });
};

const backupToGoogleDrive = async (filename, data) => {
  const drive  = getDrive();
  const stream = Readable.from([JSON.stringify(data, null, 2)]);

  await drive.files.create({
    requestBody: {
      name:     filename,
      parents:  [BACKUP_FOLDER_ID],
      mimeType: 'application/json',
    },
    media: {
      mimeType: 'application/json',
      body:     stream,
    },
  });
};

export default async function handler(req, res) {
  const cronSecret = req.headers['authorization'];
  if (cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const date = new Date().toISOString().slice(0, 10);

    const [profiles, promoCodes, waitlist] = await Promise.all([
      sb.from('profiles').select('id, is_pro, referral_count, referral_tier, created_at'),
      sb.from('promo_codes').select('*'),
      sb.from('waitlist').select('id, confirmed, confirmed_at, created_at'),
    ]);

    await Promise.all([
      backupToGoogleDrive(
        `profiles_backup_${date}.json`,
        profiles.data || []
      ),
      backupToGoogleDrive(
        `promo_codes_backup_${date}.json`,
        promoCodes.data || []
      ),
      backupToGoogleDrive(
        `waitlist_backup_${date}.json`,
        waitlist.data || []
      ),
    ]);

    return res.json({ success: true, backed_up: date });
  } catch (error) {
    console.error('[admin-weekly-backup]', error.message);
    return res.status(500).json({ error: error.message });
  }
}
