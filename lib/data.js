/**
 * Library for storing and editing data
 */

// Dependecies
const fs = require('fs');
const path = require('path');

// Container for the module (to be exported)
const lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '..', '.data')

// Write data to a file
lib.create = function(dir, file, data, callback) {
  // Open the file for writing
  const filePath = path.join(`${lib.baseDir}`, dir, `${file}.json`);
  
  fs.open(filePath, 'wx', function(err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);

      // Write to file and close it
      fs.writeFile(fileDescriptor, stringData, function(err) {
        if (!err) {
          fs.close(fileDescriptor, function(err) {
            if (!err) {
              callback(false);
            } else {
              callback('Error closing new file');
            }
          });
        } else {
          callback('Error writing to new file');
        }
      })
    } else {
      callback('Could not create new file, it may already exist');
    }
  });
};

// Read data from a file
lib.read = function(dir, file, callback) {
  const filePath = path.join(`${lib.baseDir}`, dir, `${file}.json`);
  fs.readFile(filePath, 'utf8', function(err, data) {
    callback(err, data);
  });
}

// Update data inside a file
lib.update = function(dir, file, data, callback) {
  // Open the file for writing
  const filePath = path.join(`${lib.baseDir}`, dir, `${file}.json`);
  
  fs.open(filePath, 'r+', function(err, fileDescriptor) {
    if (!err && fileDescriptor) {
      // Convert data to string
      const stringData = JSON.stringify(data);
      
      // Truncate the file
      fs.ftruncate(fileDescriptor, function(err) {
        if (!err) {
          // Write to the file and close it
          fs.writeFile(fileDescriptor, stringData, function(err) {
            if (!err) {
              fs.close(fileDescriptor, function(err) {
                if (!err) {
                  callback(false);
                } else {
                  callback('Error closing existing file');
                }
              })
            } else {
              callback('Error writing to existing file');
            }
          })
        } else {
          callback('Error truncating file');
        }
      });
    } else {
      callback('Could not open the file for updating, it may not exist yet');
    }
  })
}

// Delete a file
lib.delete = function(dir, file, callback) {
  // Unlink the file
  const filePath = path.join(`${lib.baseDir}`, dir, `${file}.json`);

  fs.unlink(filePath, function(err) {
    if (!err) {
      callback(false);
    } else {
      callback('Error deleting file');
    }
  })
};

// Export the module
module.exports = lib;