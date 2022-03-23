/**
 * Request handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');

// Define a handlers
var handlers = {}

// Users
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];

  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for the users submethods
handlers._users = {};

// Users - get
// Required data: firstName, lastName, phone, password, tosAgreement
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const firstName = typeof(data.payload.firstName) === 'string' &&
    data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' &&
    data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const phone = typeof(data.payload.phone) === 'string' &&
    data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  const password = typeof(data.payload.password) === 'string' &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' &&
    data.payload.tosAgreement ===  true ? true : false;

  if (
    firstName &&
    lastName &&
    phone &&
    password &&
    tosAgreement
  ) {
    // Make sure that the user doesn't already exists
    _data.read('users', phone, (err) => {
      if (err) {
        // Hash the password
        const hashedPassword = helpers.hash(password);

        // Create the user object
        if (hashedPassword) {
          const user = {
            firstName,
            lastName,
            phone,
            hashedPassword,
            tosAgreement
          };
  
          // Store the user
          _data.create('users', phone, user, err => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: 'Could not create a new user' });
            }
          })
        } else {
          callback(500, { Error: `Could not hash the user's password` });
        }
        
      } else {
        // User already exists
        callback(400, { Error: 'A user with that phone number already exists' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required fields' });
  }
};

// Users - get
// Required data: phone
// Optional data: none
// @TODO Only let an authenticatd user access their object. Don't let them access anyone elses
handlers._users.get = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' 
    && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  
  if (phone) {
    // Lookup the user
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        // Remove the hashed password from the user object before returning it to the requester
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - put
// Required data: phone
// Optional data: firstName, lastName, password, tosAgreement (at least one must be specified)
// @TODO Only let an authenticatd user access their object. Don't let them access anyone elses
handlers._users.put = (data, callback) => {
  // Check for the required fields
  const phone = typeof(data.payload.phone) === 'string' 
    && data.payload.phone.trim().length === 10 ? data.payload.phone.trim() : false;
  
  // Check for the optional fields
  const firstName = typeof(data.payload.firstName) === 'string' &&
    data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof(data.payload.lastName) === 'string' &&
    data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const password = typeof(data.payload.password) === 'string' &&
    data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone) {
    // Error if nothing is sent to update
    if (firstName || lastName || password) {
      // Lookup the user
      _data.read('users', phone, (err, data) => {
        if (!err && data) {
          // Update the fields necessary
          if (firstName) {
            data.firstName = firstName;
          }
          if (lastName) {
            data.lastName = lastName;
          }
          if (password) {
            data.hashedPassword = helpers.hash(password);
          }

          // Store the new updates
          _data.update('users', phone, data, (err) => {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, { Error: 'Could not update the user' });
            }
          })
        } else {
          callback(400, { Error: 'The specified user does not exist' });
        }
      });
    } else {
      callback(400, { Error: 'Missing fields to update' });
    }
    
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Users - delete
// Required data: phone
// @TODO Only let an authenticatd user access their object. Don't let them access anyone elses
// @TODO Cleanup (delete) any other data files associated with this user
handlers._users.delete = (data, callback) => {
  // Check that the phone number is valid
  const phone = typeof(data.queryStringObject.phone) === 'string' 
    && data.queryStringObject.phone.trim().length === 10 ? data.queryStringObject.phone.trim() : false;
  
  if (phone) {
    // Lookup the user
    _data.read('users', phone, (err, data) => {
      if (!err && data) {
        _data.delete('users', phone, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: 'Could not delete d the specified user' });
          }
        })
      } else {
        callback(400, { Error: 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { Error: 'Missing required field' });
  }
};

// Ping handler
handlers.ping = (data, callback) => {
  callback(200);
}

// Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

// Export the module
module.exports = handlers;