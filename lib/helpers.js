/**
 * Helpers for various tasks
 */

// Dependencies
const queryString = require('querystring');
const https = require('https');
const path = require('path')
const fs = require('fs')
const crypto = require('crypto');
const config = require('./config');

// Container for all the helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = str => {
  if (typeof(str) === 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
}

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
}

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
  strLength = typeof(strLength) === 'number' && strLength > 0 ? strLength : false;

  if (strLength) {
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let  str = '';
    for(let i=0; i<strLength; i++) {
      // Get a random character from the possibleCharacters string
      const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      
      // Append this character to the final string
      str += randomCharacter;
    }

    // Return thei final string
    return str;
  } else {
    return false;
  }
}

// Send an SMS message via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  // Validate the parameters
  phone = typeof(phone) === 'string' && phone.trim().length === 10 || phone.trim().length === 11 ? phone.trim() : false;
  msg = typeof(msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

  if (phone && msg) {
    // Configure the request payload
    const payload = {
      From: config.twilio.fromPhone,
      To: '+55' + phone, 
      Body: msg
    };

    // Stringify the payload
    const stringPayload = queryString.stringify(payload);

    // Configure the request details
    const requestDetails = {
      protocol: 'https:',
      hostname: 'api.twilio.com',
      method: 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ':' + config.twilio.authToken,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    }

    // Instantiate the request object
    const req = https.request(requestDetails, res => {
      // Grab the status of the sent request
      const status = res.statusCode;

      // Callback successfully if the request went through
      if (status === 200 || status === 201) {
        callback(false);
      } else {
        callback('Status code returned was ' + status);
      }
    });

    // Bind to the error event so it doesn't get thrown
    req.on('error', e => {
      callback(e);
    });

    // Add the payload 
    req.write(stringPayload);

    // End the request
    req.end();
  } else {
    callback('Given parameters were missing or invalid');
  }
}

// Get the string content of the template
helpers.getTemplate = (templateName, callback) => {
  templateName = typeof(templateName) === 'string' && templateName.length > 0 ? templateName : false;

  if (templateName) {
    const templatesDir = path.join(__dirname, '/../templates/')
    fs.readFile(templatesDir + templateName + '.html', 'utf8', (err, str) => {
      if (!err && str && str.length > 0) {
        callback(false, str)
      } else {
        callback('No template could be found')
      }
    })
  } else {
    callback('A valid temlate name was not pecified')
  }
}

// Export the module
module.exports = helpers;