const scheduleNode = require('./schedule');
const webhookNode = require('./webhook');
const httpNode = require('./http');
const codeNode = require('./code');
const googleSheetNode = require('./googleSheet');

module.exports = {
  schedule: scheduleNode,
  webhook: webhookNode,
  http: httpNode,
  code: codeNode,
  googleSheet: googleSheetNode
};
