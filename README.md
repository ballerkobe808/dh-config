dh-config
=========

Node module that makes it easier to setup and load deployment environment settings.

Getting Started
===============

dh-conf uses json files to store your settings. You need to create a directory within your project and create separate config files for each of your deployment environments.

Example Directory Structure:

    MyApp
      - config
        - json
          - all.json
          - development.json
          - local.json
          - test.json
          - production.json
      - routes
      - utilities
      - services
      - models
      
Usage
==========

#### 1) Require the module when needed and pass in the file path to the directory where your json config files are stored:
    
    let dhConfig = require('dh-config')(__dirname + '/../config/json', logger);
    
   (Note) passing in the file path only has to be performed on the first require to dh-config. All subsequent
   requires can simply be invoked with:
    
    let dhConfig = require('dh-config')();

   (Note) you may pass in a reference to a logger if you have one. It assumes your logger has a .info, .warn, and .error function on it.
    
#### 2) Load a config file by passing in the name of the config file without the .json:

    dhConfig.loadConfig('all');

#### 3) You can also automatically load a config file that matches your NODE_ENV name.
   (Note) you can either specify your0 environment using:
      
    NODE_ENV=[environment name] 
      
   or by simply specifying the name on the command line:
      
    node server.js [environment name]
    
   To load the config based on the environment name, perform the following call while passing in a default config name to use in case the environment name was not specified:
    
    dhConfig.loadEnvironmentConfig('local');
      
#### 4) You can now access your settings by calling the following method:

    dhConfig.get(KEY);
      
  You may specify multiple keys if you are traversing through your settings objects. For example, if you had the following json file:
  
    {
      "name": "test",
      "serverSettings" : {
          "port" : 3000
      }
    }
    
  To access the server port setting by calling:

    dhConfig.get('serverSettings:port');
      
  Or if you don't like the : separator you can set the delimiter of your choice:

    dhConfig.setDelimiter('.');

  Now you will be able to use the dot notation to access nested properties:

    dhConfig.get('serverSettings.port');

#### 5) You can load a config file using a file path:

    dhConfig.loadConfigWithPath(__dirname + '/config/json/local.json');
