# homebridge-eedomus-thermostat

[![npm](https://img.shields.io/npm/v/homebridge-eedomus-thermostat.svg)](https://www.npmjs.com/package/homebridge-eedomus-thermostat) [![npm](https://img.shields.io/npm/dt/homebridge-eedomus-thermostat.svg)](https://www.npmjs.com/package/homebridge-eedomus-thermostat)

## Description

This [homebridge](https://github.com/nfarina/homebridge) plugin exposes a web-based thermostat to Apple's [HomeKit](http://www.apple.com/ios/home/). Using simple HTTP requests, the plugin allows you to set the thermostat mode and control the target temperature.
This is a fork from Tom Rodrigues's [homebridge-web-thermostat](https://github.com/Tommrodrigues/homebridge-web-thermostat#readme).

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-eedomus-thermostatAC`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "Thermostat",
       "name": "Thermostat",
       "apiroute": "http://myurl.com"
     }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `Thermostat` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `apiroute` | Eedomus URL (http://localip/api OR https://api.eedomus.com) | N/A |
| `apiuser` | Eedomus API_USER | N/A |
| `apisecret` | Eedomus API_SECRET | N/A |
| `thermometerid` | API ID of the thermometer used in eedomus | N/A |
| `thermostatid` | API ID of the thermostat used in eedomus | N/A |
| `heaterid` | API ID of one heater used in eedomus | N/A |

### Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `temperatureDisplayUnits` | Whether you want °C (`0`) or °F (`1`) as your units | `0` |
| `maxTemp` | Upper bound for the temperature selector in the Home app | `25` |
| `minTemp` | Lower bound for the temperature selector in the Home app | `16` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `pollInterval` | Time (in seconds) between device polls | `300` |
| `timeout` | Time (in milliseconds) until the accessory will be marked as _Not Responding_ if it is unreachable | `3000` |
| `port` | Port for your HTTP listener (if enabled) | `2000` |
| `http_method` | HTTP method used to communicate with the device | `GET` |
| `username` | Username if HTTP authentication is enabled | N/A |
| `password` | Password if HTTP authentication is enabled | N/A |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | apiroute |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |
