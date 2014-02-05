// module dependencies.
var path = require('path');
var fs = require('fs');
var util = require('util');
var _ = require('lodash');

// singleton instance reference.
var _instance;

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
    if (_.contains(key, delimiter)) {
        return key.split(delimiter).join(':');
    }
}

/**
 * Constructor for the server config module.
 * @constructor
 * @param configJsonDirectory - The file path to the config json directory holding all the json config files.
 */
var ServerConfig = function (configJsonDirectory) {
    // set the config directory.
    this.configDirectory = configJsonDirectory;

    // set the default delimiter for nested keys.
    this.delimiter = ":";

    if (_.isUndefined(this.configDirectory) || _.isEmpty(this.configDirectory) || !fs.existsSync(this.configDirectory)) {
        // print a message.
        util.debug('Config directory is invalid.');

        // return null.
        return null;
    }

    // save reference to nconf module.
    this.nconf = require('nconf');

    // load the command line and environment variables first.
    this.nconf.argv().env();
};

/**
 * Gets the file path of the configuration file to use.
 * @param configName - The configuration name (local, dev, test, prod).
 * @return {String} - The file path of the configuration file or UNDEFINED if file path
 * was not created correctly.
 */
ServerConfig.prototype.getConfigFilePath = function(configName) {
    // set file path to undefined by default.
    var filePath = undefined;

    // build the file name
    var fileName = getConfigFileName(configName);

    // combine the file name and config directory into a path string.
    var tempPath = path.join(this.configDirectory, fileName);

    // check that the filePath is valid and return it if it is.
    // if not, return undefined.
    if (fs.existsSync(tempPath)) {
        filePath = tempPath;

        // debug print.
        util.debug('Loading config file: ' + fileName);
    }
    else {
        util.debug('Failed to load config file for configuration: ' + configName);
    }

    // return the file path.
    return filePath;
}

/**
 * Loads a config json file.
 * @param configName - The name of the configuration.
 */
ServerConfig.prototype.loadConfig = function(configName) {
    // get the file path of the json file which holds settings for the specified config name.
    var configFilePath = this.getConfigFilePath(configName);

    // load the config file settings into nconf.
    this.nconf.file('configName', configFilePath);
};

/**
 * Loads the environment specific config file.
 */
ServerConfig.prototype.loadEnvironmentConfig = function(defaultConfig) {
    // get config name if present
    var configName = null;

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
            util.debug('Running as: ' + configName);
        }
        else {
            // set the config name.
            configName = defaultConfig;

            // debug print to tell the user that the server is running on the default config.
            util.debug('Running as: ' + defaultConfig);
        }
    }

    // get the config file path.
    var configFilePath = this.getConfigFilePath(configName);

    // check if the config file path is undefined.
    // this happens when a config file path was not created correctly.
    if (!_.isUndefined(configFilePath)) {
        // load the config filePath.
        this.nconf.file('environmentConfig', configFilePath);
    }

    // add the config name to nconf.
    this.nconf.set('environmentName', configName);
};

/**
 * Setter for the delimiter for nested key values.
 * @param delimiter - The delimiter to use.
 */
ServerConfig.prototype.setDelimiter = function(delimiter) {
    if (_.isUndefined(delimiter) || _.isNull(delimiter) || _.isEmpty(delimiter) || !_.isString(delimiter)) {
        util.debug('Invalid delimiter specified.');
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
    var currentValue = null;

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
 * return the singleton instance of the server config module.
 * @param configJsonDirectory - The directory where the json config files live.
 * @returns {*} - The singleton instance.
 */
module.exports = function(configJsonDirectory) {
    // check if the current instance is undefined.
    // if so, create a new server config instance and save it.
    if (_.isUndefined(_instance)) {
        _instance = new ServerConfig(configJsonDirectory)
    }

    // return the instance.
    return _instance;
};