const { google } = require('googleapis');

// Google Sheets node
module.exports = {
  type: 'googleSheet',
  name: 'Google Sheets',
  description: 'Read from or write to Google Sheets',
  
  async execute(config, context, nodeResults) {
    const { 
      operation = 'read', 
      spreadsheetId, 
      range,
      values,
      credentials 
    } = config;

    if (!spreadsheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    if (!range) {
      throw new Error('Range is required (e.g., Sheet1!A1:D10)');
    }

    // For demo purposes, if no credentials, return mock data
    if (!credentials) {
      console.warn('No Google credentials provided, using mock data');
      return this.getMockData(operation, spreadsheetId, range, values);
    }

    try {
      const auth = new google.auth.GoogleAuth({
        credentials: typeof credentials === 'string' ? JSON.parse(credentials) : credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
      });

      const sheets = google.sheets({ version: 'v4', auth });

      switch (operation) {
        case 'read':
          return await this.readSheet(sheets, spreadsheetId, range);
        
        case 'append':
          return await this.appendToSheet(sheets, spreadsheetId, range, values, context, nodeResults);
        
        case 'update':
          return await this.updateSheet(sheets, spreadsheetId, range, values, context, nodeResults);
        
        case 'clear':
          return await this.clearSheet(sheets, spreadsheetId, range);
        
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      throw new Error(`Google Sheets error: ${error.message}`);
    }
  },

  async readSheet(sheets, spreadsheetId, range) {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });

    const rows = response.data.values || [];
    
    // Convert to array of objects using first row as headers
    if (rows.length > 1) {
      const headers = rows[0];
      const data = rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });
      
      return {
        raw: rows,
        data,
        rowCount: rows.length,
        range: response.data.range
      };
    }

    return {
      raw: rows,
      data: [],
      rowCount: rows.length,
      range: response.data.range
    };
  },

  async appendToSheet(sheets, spreadsheetId, range, values, context, nodeResults) {
    const processedValues = this.processValues(values, context, nodeResults);
    
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: processedValues
      }
    });

    return {
      updatedRange: response.data.updates?.updatedRange,
      updatedRows: response.data.updates?.updatedRows,
      updatedCells: response.data.updates?.updatedCells
    };
  },

  async updateSheet(sheets, spreadsheetId, range, values, context, nodeResults) {
    const processedValues = this.processValues(values, context, nodeResults);
    
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: processedValues
      }
    });

    return {
      updatedRange: response.data.updatedRange,
      updatedRows: response.data.updatedRows,
      updatedCells: response.data.updatedCells
    };
  },

  async clearSheet(sheets, spreadsheetId, range) {
    const response = await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range
    });

    return {
      clearedRange: response.data.clearedRange
    };
  },

  processValues(values, context, nodeResults) {
    if (!values) return [[]];
    
    if (typeof values === 'string') {
      try {
        values = JSON.parse(values);
      } catch (e) {
        // Treat as single value
        return [[values]];
      }
    }

    // If it's already a 2D array, use it
    if (Array.isArray(values) && Array.isArray(values[0])) {
      return values;
    }

    // If it's an array of objects, convert to 2D array
    if (Array.isArray(values) && values.length > 0 && typeof values[0] === 'object') {
      const headers = Object.keys(values[0]);
      const rows = values.map(obj => headers.map(h => obj[h] || ''));
      return [headers, ...rows];
    }

    // If it's a single array, wrap it
    if (Array.isArray(values)) {
      return [values];
    }

    return [[String(values)]];
  },

  getMockData(operation, spreadsheetId, range, values) {
    switch (operation) {
      case 'read':
        return {
          raw: [
            ['Name', 'Email', 'Status'],
            ['John Doe', 'john@example.com', 'Active'],
            ['Jane Smith', 'jane@example.com', 'Pending']
          ],
          data: [
            { Name: 'John Doe', Email: 'john@example.com', Status: 'Active' },
            { Name: 'Jane Smith', Email: 'jane@example.com', Status: 'Pending' }
          ],
          rowCount: 3,
          range: range,
          mock: true
        };
      
      case 'append':
      case 'update':
        return {
          updatedRange: range,
          updatedRows: 1,
          updatedCells: Array.isArray(values) ? values.length : 1,
          mock: true
        };
      
      case 'clear':
        return {
          clearedRange: range,
          mock: true
        };
      
      default:
        return { mock: true };
    }
  }
};
