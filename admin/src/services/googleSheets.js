import { google } from 'googleapis';

const getAuth = () =>
  new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key:  process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });

const getSheets = () => google.sheets({ version: 'v4', auth: getAuth() });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

export const updateSheet = async (sheetName, data, headerRow) => {
  const sheets = getSheets();
  // Clear data rows (keep header if user manually formatted it)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:Z`,
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: [headerRow, ...data] },
  });
};

export const appendToSheet = async (sheetName, row) => {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] },
  });
};

export const syncRevenueToSheets = async (data) => {
  await updateSheet(
    'Revenue Dashboard',
    data.map((d) => [
      d.date, d.mrr, d.newSubscribers || 0,
      d.cancellations || 0, d.netGrowth || 0,
      d.aiCosts, d.netProfit, d.margin,
    ]),
    ['Date', 'MRR', 'New Subscribers', 'Cancellations',
     'Net Growth', 'AI Costs', 'Net Profit', 'Margin %']
  );
};

export const syncUsersToSheets = async (data) => {
  await updateSheet(
    'User Metrics',
    data.map((d) => [
      d.date, d.totalUsers, d.active30,
      d.active7, d.activeToday, d.proUsers,
      d.trialUsers, d.churnRate || 0,
    ]),
    ['Date', 'Total Users', 'Active 30d', 'Active 7d',
     'Active Today', 'Pro Users', 'Trial Users', 'Churn Rate']
  );
};

export const syncFeaturesToSheets = async (features) => {
  await updateSheet(
    'Feature Usage',
    features.map((f) => [
      f.name, f.callsThisWeek, f.uniqueUsers,
      f.callsLastWeek, f.wowChange || 0,
    ]),
    ['Feature', 'Uses This Week', 'Unique Users',
     'Last Week', 'WoW Change %']
  );
};

export const syncAICostsToSheets = async (data) => {
  await updateSheet(
    'AI Costs',
    data.map((d) => [
      d.date, d.feature || 'all', d.calls || 0,
      d.tokensUsed, d.cost, d.costPerUser || 0,
    ]),
    ['Date', 'Feature', 'Calls', 'Tokens Used', 'Cost', 'Cost Per User']
  );
};

export const syncPromodCodesToSheets = async (codes) => {
  await updateSheet(
    'Promo Codes',
    codes.map((c) => [
      c.code, c.discount_type,
      `${c.discount_value}${c.discount_type === 'percent' ? '%' : '¢'}`,
      c.current_uses || 0, c.max_uses || '∞',
      c.notes || '', c.active ? 'Yes' : 'No',
      c.created_at?.slice(0, 10),
    ]),
    ['Code', 'Type', 'Discount', 'Uses', 'Max Uses', 'Notes', 'Active', 'Created']
  );
};

export const addWaitlistToSheets = async (signup) => {
  await appendToSheet('Waitlist', [
    new Date().toISOString().slice(0, 10),
    signup.first_name || '',
    signup.email.replace(/(.{2})([^@]*)(@.*)/, '$1***$3'),
    signup.confirmed ? 'Yes' : 'No',
    'Website',
  ]);
};

export const runDailySync = async (overviewData, featuresData) => {
  const today = new Date().toISOString().slice(0, 10);

  const revenueRow = [{
    date:        today,
    mrr:         overviewData.mrr,
    aiCosts:     overviewData.aiCostThisMonth,
    netProfit:   overviewData.netProfitThisMonth,
    margin:      overviewData.mrr > 0
      ? ((overviewData.netProfitThisMonth / overviewData.mrr) * 100).toFixed(1)
      : 0,
  }];

  const userRow = [{
    date:       today,
    totalUsers: overviewData.totalUsers,
    active30:   overviewData.active30,
    active7:    overviewData.active7,
    activeToday:overviewData.activeToday,
    proUsers:   overviewData.proUsers,
    trialUsers: overviewData.trialUsers,
  }];

  await Promise.all([
    syncRevenueToSheets(revenueRow).catch(console.error),
    syncUsersToSheets(userRow).catch(console.error),
    syncFeaturesToSheets(featuresData?.features || []).catch(console.error),
  ]);
};
