// module dependencies.
const path = require('path');
const fs = require('fs');
const _ = require('lodash');

// singleton instance reference.
let _instance;

/**
 * Builds the filename of the json config file based on
 * the configuration name.
 * @param configName - The configuration name.
 * @returns {string} - the file name of the config file.
 */
function getConfigFileName(configName) {
  return configName + '.json';
}

/**
 * Replaces your default delimiter with the nconf delimiter.
 * @param key - The key to replace your custom delimiter in.
 * @param delimiter - Your custom delimiter.
 * @returns {string} - The nconf formatted key.
 */
function cleanKey (key, delimiter) {
  // make sure the delimiter is present.
  if (_.includes(key, delimiter)) {
    return key.split(delimiter).join(':');
  }
  else {
    return key;
  }
}

/**
 * Constructor for the server config module.
 * @constructor
 * @param configJsonDirectory - The file path to the config json directory holding all the json config files.
 * @param logger - reference to a logger object. Note: assumes logger has an .info , .warn, .error function.
 */
let ServerConfig = function (configJsonDirectory, logger) {
  // set the config directory.
  this.configDirectory = configJsonDirectory;

  // set the default delimiter for nested keys.
  this.delimiter = ".";

  // set debug flag to false by default.
  this.debug = false;

  // make sure the config directory is valid.
  if (_.isUndefined(this.configDirectory) || _.isEmpty(this.configDirectory) || !fs.existsSync(this.configDirectory)) {
    // print a message.
    this.error('Config directory is invalid.');

    // exit.
    return;
  }

  // save reference to nconf module.
  this.nconf = require('nconf');

  // load the command line and environment variables first.
  this.nconf.argv().env();

  // if the logger reference is set.
  if (logger) {
    this.logger = logger;
  }
};

/**
 * Sets the environment name.
 * @param defaultConfig
 */
ServerConfig.prototype.setEnvironmentName = function(defaultConfig) {
  // initialize to null.
  let configName = null;

  // check if an environment was specified.
  if (process.env.NODE_ENV) {
    configName = process.env.NODE_ENV;
  }
  else { // check if the environment was specified as a regular command line parameter instead.
    // check for command line parameters.
    if (process.argv.length > 2) {
      // get the last item in the argv array.
      configName = (process.argv[process.argv.length -1]).toString();

      // print out which environment its using.
      this.info('Setting environment name to: ' + configName);
    }
    else {
      // set the config name.
      configName = defaultConfig;

      // debug print to tell the user that the server is running on the default config.
      this.info('Setting environment name to: ' + defaultConfig);
    }
  }

  // add the config name to nconf.
  this.nconf.overrides({'environmentName': configName});
};

/**
 * Loads the environment variables into nconf.
 */
ServerConfig.prototype.loadEnvironmentVariables = function () {
  // load the command line and environment variables first.
  this.nconf.argv().env();
};

/**
 * Setter method for the debug flag.
 * @param debugModeOn - If the module should be in debug mode or not.
 */
ServerConfig.prototype.setDebugMode = function(debugModeOn) {
  this.debug = debugModeOn;
};

/**
 * Gets the file path of the configuration file to use.
 * @param configName - The configuration name (local, dev, test, prod).
 * @return {String} - The file path of the configuration file or UNDEFINED if file path
 * was not created correctly.
 */
ServerConfig.prototype.getConfigFilePath = function(configName) {
  // set file path to undefined by default.
  let filePath = undefined;

  // build the file name
  let fileName = getConfigFileName(configName);

  // combine the file name and config directory into a path string.
  let tempPath = path.join(this.configDirectory, fileName);

  // check that the filePath is valid and return it if it is.
  // if not, return undefined.
  if (fs.existsSync(tempPath)) {
    filePath = tempPath;
    this.info('Loading config file: ' + fileName);
  }
  else {
    this.error('Failed to load config file for configuration: ' + configName);
  }

  // return the file path.
  return filePath;
};

/**
 * Loads a config json file.
 * @param configName - The name of the configuration.
 */
ServerConfig.prototype.loadConfig = function(configName) {
  // get the file path of the json file which holds settings for the specified config name.
  let configFilePath = this.getConfigFilePath(configName);

  // load the config file settings into nconf.
  this.nconf.file(configName, configFilePath);

  // load the command line and environment variables first.
  // FORCE RELOAD OF ENVIRONMENT VARIABLES TO MAKE THEM MORE IMPORTANT.
  this.nconf.argv().env();
};

/**
 * Loads a json config file at the given file path.
 * @param configName - The name of the config.
 * @param filePath - The file path to the file.
 */
ServerConfig.prototype.loadConfigWithPath = function (configName, filePath) {
  // check that the filePath is valid.
  if (fs.existsSync(filePath)) {
    this.info('Loading config file at path: ' + filePath);

    // load the file.
    this.nconf.file(configName, filePath);

    // load the command line and environment variables first.
    // FORCE RELOAD OF ENVIRONMENT VARIABLES TO MAKE THEM MORE IMPORTANT.
    this.nconf.argv().env();
  }
  else {
    this.error('Failed to load config file at path: ' + filePath);
  }
};

/**
 * Loads the environment specific config file.
 */
ServerConfig.prototype.loadEnvironmentConfig = function(defaultConfig) {
  // get config name if present
  let configName = null;

  // check if an environment was specified.
  if (process.env.NODE_ENV) {
    configName = process.env.NODE_ENV;
  }
  else { // check if the environment was specified as a regular command line parameter instead.
    // check for command line parameters.
    if (process.argv.length > 2) {
      // get the last item in the argv array.
      configName = (process.argv[process.argv.length -1]).toString();

      // print out which environment its using.
      this.info('Running as: ' + configName);
    }
    else {
      // set the config name.
      configName = defaultConfig;

      // debug print to tell the user that the server is running on the default config.
      this.info('Running as: ' + defaultConfig);
    }
  }

  // get the config file path.
  let configFilePath = this.getConfigFilePath(configName);

  // check if the config file path is undefined.
  // this happens when a config file path was not created correctly.
  if (!_.isUndefined(configFilePath)) {
    // load the config filePath.
    this.nconf.file(configName, configFilePath);
  }

  // add the config name to nconf.
  this.nconf.overrides({'environmentName': configName});

  // load the command line and environment variables first.
  // FORCE RELOAD OF ENVIRONMENT VARIABLES TO MAKE THEM MORE IMPORTANT.
  this.nconf.argv().env();
};

/**
 * Setter for the delimiter for nested key values.
 * @param delimiter - The delimiter to use.
 */
ServerConfig.prototype.setDelimiter = function(delimiter) {
  if (_.isUndefined(delimiter) || _.isNull(delimiter) || _.isEmpty(delimiter) || !_.isString(delimiter)) {
    this.error('Invalid delimiter specified.');

    return;
  }

  // set the new delimiter.
  this.delimiter = delimiter;
};

/**
 * Getter method that takes a variable number of parameters and traverses the main settings object for the value.
 * @param {*} - One or more key params in order of how to traverse the settings object.
 * @returns {*} - The value requested.
 */
ServerConfig.prototype.get = function() {
  // set the current value to null
  let currentValue = null;

  // check if there are arguments
  if (arguments.length > 0) {
    // set current value to the first argument.
    currentValue = this.nconf.get(cleanKey(arguments[0], this.delimiter));
  }

  // check if you need to traverse further.
  if (arguments.length > 1) {
    for (var i = 1; i < arguments.length; i++) {
      currentValue = currentValue[cleanKey(arguments[i], this.delimiter)];
    }
  }

  // return the value.
  return currentValue;
};

/**
 * Gets the environment name.
 * @return {String} - The environment name.
 */
ServerConfig.prototype.getEnvironmentName = function() {
  return this.nconf.get('environmentName');
};

/**
 * Info log function.
 * @param value
 */
ServerConfig.prototype.info = function (value) {
  if (this.logger) {
    this.logger.info(value);
  }
  else {
    console.log(value);
  }
};

/**
 * Warning log function.
 * @param value
 */
ServerConfig.prototype.warn = function (value) {
  if (this.logger) {
    this.logger.warn(value);
  }
  else {
    console.warn(value);
  }
};

/**
 * Error log function.
 * @param value
 */
ServerConfig.prototype.error = function (value) {
  if (this.logger) {
    this.logger.error(value);
  }
  else {
    console.error(value);
  }
};

/**
 * return the singleton instance of the server config module.
 * @param configJsonDirectory - The directory where the json config files live.
 * @param logger - The logger object reference.
 * @returns {*} - The singleton instance.
 */
module.exports = function(configJsonDirectory, logger) {
  // check if the current instance is undefined.
  // if so, create a new server config instance and save it.
  if (_.isUndefined(_instance)) {
    _instance = new ServerConfig(configJsonDirectory, logger)
  }

  // return the instance.
  return _instance;
};