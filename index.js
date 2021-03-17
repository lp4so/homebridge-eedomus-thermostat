var Service, Characteristic
const packageJson = require('./package.json')
const request = require('request')
const ip = require('ip')
const http = require('http')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-eedomus-thermostat', 'Thermostat', Thermostat)
}

function Thermostat (log, config) {
  this.log = log

  this.name = config.name
  this.apiroute = config.apiroute || 'api.eedomus.com'
  this.pollInterval = config.pollInterval || 300
  this.heatOnly = true
  this.listener = config.listener || false
  this.port = config.port || 2000
  this.requestArray = ['targetHeatingCoolingState', 'targetTemperature', 'coolingThresholdTemperature', 'heatingThresholdTemperature']

  this.manufacturer = config.manufacturer || packageJson.author.name
  this.serial = config.serial || this.apiroute
  this.model = config.model || packageJson.name
  this.firmware = config.firmware || packageJson.version

  this.thermostatid = config.thermostatid
  this.heaterid = config.heaterid
  this.thermometerid = config.thermometerid

  this.apiuser = config.apiuser || null
  this.apisecret = config.apisecret || null
  this.timeout = config.timeout || 3000
  this.http_method = config.http_method || 'GET'

  this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0
  this.maxTemp = config.maxTemp || 25
  this.minTemp = config.minTemp || 16

  if (this.listener) {
    this.server = http.createServer(function (request, response) {
      var parts = request.url.split('/')
      var partOne = parts[parts.length - 2]
      var partTwo = parts[parts.length - 1]
      if (parts.length === 3 && this.requestArray.includes(partOne)) {
        this.log('Handling request: %s', request.url)
        response.end('Handling request')
        this._httpHandler(partOne, partTwo)
      } else {
        this.log.warn('Invalid request: %s', request.url)
        response.end('Invalid request')
      }
    }.bind(this))

    this.server.listen(this.port, function () {
      this.log('Listen server: http://%s:%s', ip.address(), this.port)
    }.bind(this))
  }

  this.service = new Service.Thermostat(this.name)
}

Thermostat.prototype = {

  identify: function (callback) {
    this.log('Identify requested!')
    callback()
  },

  _httpRequest: function (url, body, method, callback) {
    request({
      url: url,
      body: body,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false,
      agent: false,
      pool: {maxSockets: Infinity},
      auth: this.auth
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  },

  _getStatus: function (callback) {
    var url = this.apiroute + '/get?api_user=' + this.apiuser + '&api_secret=' + this.apisecret + '&action=periph.value&periph_id='
    
    var heaterurl = url + this.heaterid
    var thermometerurl = url + this.thermometerid
    var thermostaturl = url + this.thermostatid


    this.log.debug('Getting heater status: %s', heaterurl)
    this._httpRequest(heaterurl, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting heater status: %s', error.message)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(new Error('Polling failed'))
        callback(error)
      }
      else {
        this.log.debug('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)

	      var rescurrentHeatingCoolingState = json.body.last_value
        if(rescurrentHeatingCoolingState > 20){
		      rescurrentHeatingCoolingState = 1
	      }
else{
rescurrentHeatingCoolingState = 0
}
	      this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(rescurrentHeatingCoolingState) 
        this.log('Updated CurrentHeatingCoolingState to: %s', rescurrentHeatingCoolingState)
	      callback()
      }
    }.bind(this))
    
    
    this.log.debug('Getting heater status: %s', thermometerurl)
    this._httpRequest(thermometerurl, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting thermometer status: %s', error.message)
        this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(new Error('Polling failed'))
        callback(error)
      }
      else {
        this.log.debug('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)
	this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(json.body.last_value)
        this.log('Updated CurrentTemperature to: %s', json.body.last_value)
	callback()
      }
   }.bind(this))

    this.log.debug('Getting thermostat status: %s', thermostaturl)
    this._httpRequest(thermostaturl, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error getting thermostat status: %s', error.message)
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(new Error('Polling failed'))
        callback(error)
      }
      else {
        this.log.debug('Device response: %s', responseBody)
        var json = JSON.parse(responseBody)

	var resTargetHeatingCoolingState = json.body.last_value

	var tgTemp = 0
	var tgState = 0

        if(resTargetHeatingCoolingState > 5 && resTargetHeatingCoolingState <= 30){
		tgTemp = resTargetHeatingCoolingState
		tgState = 1
	}
	else if(resTargetHeatingCoolingState == 5 || resTargetHeatingCoolingState == 'pause'){
		tgTemp = 5
		tgState = 0
	}
	else{
		callback()
	}
	if(tgTemp > 5){
	      	this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(tgTemp)
        	this.log('Updated TargetTemperature to: %s', tgTemp)
	}
	this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(tgState)
        this.log('Updated TargetHeatingCoolingState to: %s', tgState)
        callback()
      }
    }.bind(this))
  },

  _httpHandler: function (characteristic, value) {
    switch (characteristic) {
      case 'targetHeatingCoolingState':
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'targetTemperature':
        this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'coolingThresholdTemperature':
        this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      case 'heatingThresholdTemperature':
        this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(value)
        this.log('Updated %s to: %s', characteristic, value)
        break
      default:
        this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    }
  },

  setTargetHeatingCoolingState: function (value, callback) {
    var thvalue = 0
    if(value == 0 || value == 2){
	thvalue = 'pause'
    }
    if(value == 1 || value == 3){
	thvalue = 'resume'
    }

    var url = this.apiroute + '/set?api_user=' + this.apiuser + '&api_secret=' + this.apisecret + '&action=periph.value&periph_id=' + this.thermostatid + '&value=' + thvalue
    
    this.log.debug('Setting targetHeatingCoolingState: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetHeatingCoolingState: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetHeatingCoolingState to: %s', value)
        this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(value)
        callback()
      }
    }.bind(this))
  },

  setTargetTemperature: function (value, callback) {
    value = Math.round(value)
    var url = this.apiroute + '/set?api_user=' + this.apiuser + '&api_secret=' + this.apisecret + '&action=periph.value&periph_id=' + this.thermostatid + '&value=' + value
    this.log.debug('Setting targetTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting targetTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set targetTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setCoolingThresholdTemperature: function (value, callback) {
    value = value.toFixed(1)
    var url = this.apiroute + '/coolingThresholdTemperature/' + value
    this.log.debug('Setting coolingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting coolingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set coolingThresholdTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  setHeatingThresholdTemperature: function (value, callback) {
    value = value.toFixed(1)
    var url = this.apiroute + '/heatingThresholdTemperature/' + value
    this.log.debug('Setting heatingThresholdTemperature: %s', url)

    this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
      if (error) {
        this.log.warn('Error setting heatingThresholdTemperature: %s', error.message)
        callback(error)
      } else {
        this.log('Set heatingThresholdTemperature to: %s', value)
        callback()
      }
    }.bind(this))
  },

  getServices: function () {
    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(this.temperatureDisplayUnits)

    this.service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .on('set', this.setTargetHeatingCoolingState.bind(this))

    this.service
      .getCharacteristic(Characteristic.TargetTemperature)
      .on('set', this.setTargetTemperature.bind(this))
      .setProps({
        minValue: this.minTemp,
        maxValue: this.maxTemp,
        minStep: 1
      })

    if (this.heatOnly) {
        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).setProps({
	    minValue: 0,
	    maxValue: 1,
	    validValues: [0,1]
        });
    }

    if (this.temperatureThresholds) {
      this.service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .on('set', this.setCoolingThresholdTemperature.bind(this))
        .setProps({
          minValue: this.minTemp,
          maxValue: this.maxTemp,
          minStep: 0.5
        })

      this.service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .on('set', this.setHeatingThresholdTemperature.bind(this))
        .setProps({
          minValue: this.minTemp,
          maxValue: this.maxTemp,
          minStep: 0.5
        })
    }

    this._getStatus(function () {})

    setInterval(function () {
      this._getStatus(function () {})
    }.bind(this), this.pollInterval * 1000)

    return [this.informationService, this.service]
  }
}
