import { Service, PlatformAccessory /*ServiceEventTypes*/ } from 'homebridge';
import { EcowittPlatform } from './EcowittPlatform';
import { ThermoHygroSensor } from './ThermoHygroSensor';

import * as Utils from './Utils.js';

import { WindSensor } from './WindSensor';
import { RainSensor } from './RainSensor';

//------------------------------------------------------------------------------

// https://en.wikipedia.org/wiki/Ultraviolet_index

const uvInfos = [
  { level: 0, risk: 'Low' },
  { level: 3, risk: 'Moderate' },
  { level: 6, risk: 'High' },
  { level: 8, risk: 'Very High' },
  { level: 11, risk: 'Extreme' },
];

//------------------------------------------------------------------------------

export class WH65 extends ThermoHygroSensor {
  protected solarRadiation!: Service;
  protected uvIndex!: Service;
  protected uvThreshold: number;

  protected windDirection: WindSensor | undefined;
  protected windSpeed: WindSensor | undefined;
  protected windGust: WindSensor | undefined;
  protected maxDailyGust: WindSensor | undefined;

  protected rainRate: RainSensor | undefined;
  protected eventRain: RainSensor | undefined;
  protected hourlyRain: RainSensor | undefined;
  protected dailyRain: RainSensor | undefined;
  protected weeklyRain: RainSensor | undefined;
  protected monthlyRain: RainSensor | undefined;
  protected yearlyRain: RainSensor | undefined;
  protected totalRain: RainSensor | undefined;

  protected dewPoint: Service | undefined;

  constructor(
    protected readonly platform: EcowittPlatform,
    protected readonly accessory: PlatformAccessory,
    private readonly logLevel,
  ) {
    super(platform, accessory);

    this.setModel(
      'WH65',
      'Solar Powererd 7-in-1 Outdoor Sensor');

    this.setName(this.temperatureSensor, 'Outdoor Temperature');
    this.setName(this.humiditySensor, 'Outdoor Humidity');

    // Dew point

    if (!this.platform.config.ws?.dewpoint?.hide) {
      const nameDP = 'Dew Point';
      this.dewPoint = this.accessory.getService(nameDP)
      || this.accessory.addService(
        this.platform.Service.TemperatureSensor,
        nameDP,
        this.platform.serviceUuid(nameDP));

      this.setName(this.dewPoint, nameDP);
    }

    // Solar Radiation

    if (!this.platform.config.ws?.solarradiation?.hide) {
      this.solarRadiation = this.accessory.getService(this.platform.Service.LightSensor)
      || this.accessory.addService(this.platform.Service.LightSensor);

      this.setName(this.solarRadiation, 'Solar Radiation');

      this.solarRadiation
        .getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
        .setProps({
          minValue: 0,
          maxValue: 150000,
        });
    }

    // UV Sensor

    this.uvThreshold = this.platform.config?.ws?.uv?.threshold ?? 6;

    if (!this.platform.config.ws?.uv?.hide) {
      this.uvIndex = this.addOccupancySensor('UV Index');

      platform.log.log(logLevel, 'uvThreshold:', this.uvThreshold);
    }

    // Wind

    const windHide = this.platform.config?.ws?.wind?.hide || [];

    if (!windHide.includes('Direction')) {
      this.windDirection = new WindSensor(platform, accessory, 'Wind Direction');
    }

    if (!windHide.includes('Speed')) {
      this.windSpeed = new WindSensor(platform, accessory, 'Wind Speed');
    }

    if (!windHide.includes('Gust')) {
      this.windGust = new WindSensor(platform, accessory, 'Wind Gust');
    }

    if (!windHide.includes('MaxDailyGust')) {
      this.maxDailyGust = new WindSensor(platform, accessory, 'Max Daily Gust');
    }

    // Rain

    const rainHide = this.platform.config?.ws?.rain?.hide || [];

    if (!rainHide.includes('Rate')) {
      this.rainRate = new RainSensor(platform, accessory, 'Rain Rate');
    }

    if (!rainHide.includes('Event')) {
      this.eventRain = new RainSensor(platform, accessory, 'Event Rain');
    }

    if (!rainHide.includes('Hourly')) {
      this.hourlyRain = new RainSensor(platform, accessory, 'Hourly Rain');
    }

    if (!rainHide.includes('Daily')) {
      this.dailyRain = new RainSensor(platform, accessory, 'Daily Rain');
    }

    if (!rainHide.includes('Weekly')) {
      this.weeklyRain = new RainSensor(platform, accessory, 'Weekly Rain');
    }

    if (!rainHide.includes('Monthly')) {
      this.monthlyRain = new RainSensor(platform, accessory, 'Monthly Rain');
    }

    if (!rainHide.includes('Yearly')) {
      this.yearlyRain = new RainSensor(platform, accessory, 'Yearly Rain');
    }

    // if (!rainHide.includes('Total')) {
    //   this.totalRain = new RainSensor(platform, accessory, 'Total Rain');
    // }
  }

  update(dataReport, logLevel) {
    this.platform.log.log(logLevel, 'WH65 Update');
    this.platform.log.log(logLevel, '  wh65batt:', dataReport.wh65batt);
    this.platform.log.log(logLevel, '  tempf:', dataReport.tempf);
    this.platform.log.log(logLevel, '  humidity:', dataReport.humidity);
    this.platform.log.log(logLevel, '  solarradiation:', dataReport.solarradiation);
    this.platform.log.log(logLevel, '  uv:', dataReport.uv);

    const winddir = parseFloat(dataReport.winddir);
    const windspeedmph = parseFloat(dataReport.windspeedmph);
    const windgustmph = parseFloat(dataReport.windgustmph);
    const maxdailygust = parseFloat(dataReport.maxdailygust);


    this.platform.log.log(logLevel, '  winddir:', winddir);
    this.platform.log.log(logLevel, '  windspeedmph:', windspeedmph);
    this.platform.log.log(logLevel, '  windgustmph:', windgustmph);
    this.platform.log.log(logLevel, '  maxdailygust:', maxdailygust);

    this.platform.log.log(logLevel, '  rainratein:', dataReport.rainratein);
    this.platform.log.log(logLevel, '  eventrainin:', dataReport.eventrainin);
    this.platform.log.log(logLevel, '  hourlyrainin:', dataReport.hourlyrainin);
    this.platform.log.log(logLevel, '  dailyrainin:', dataReport.dailyrainin);
    this.platform.log.log(logLevel, '  weeklyrainin:', dataReport.weeklyrainin);
    this.platform.log.log(logLevel, '  monthlyrainin:', dataReport.monthlyrainin);
    this.platform.log.log(logLevel, '  yearlyrainin:', dataReport.yearlyrainin);
    this.platform.log.log(logLevel, '  totalrainin:', dataReport.totalrainin);

    this.updateStatusActive(this.temperatureSensor, true);
    this.updateStatusActive(this.humiditySensor, true);

    const lowBattery = dataReport.wh65batt === '1';

    this.updateTemperature(dataReport.tempf);
    this.updateStatusLowBattery(this.temperatureSensor, lowBattery);

    this.updateHumidity(dataReport.humidity);
    this.updateStatusLowBattery(this.humiditySensor, lowBattery);

    if (this.solarRadiation) {
      const wm2 = parseFloat(dataReport.solarradiation);
      const luxFactor = this.platform.config.ws.solarradiation?.luxFactor ?? 126.7;
      const lux = Math.round(wm2 * luxFactor * 10) / 10;

      this.updateStatusActive(this.solarRadiation, true);
      this.updateName(this.solarRadiation, `Solar Radiation: ${wm2} W/m²`);
      this.solarRadiation.updateCharacteristic(
        this.platform.Characteristic.CurrentAmbientLightLevel,
        lux);
      this.updateStatusLowBattery(this.solarRadiation, lowBattery);
    }

    if (this.uvIndex) {
      const uv = parseInt(dataReport.uv);

      this.updateStatusActive(this.uvIndex, true);
      this.updateName(this.uvIndex, `UV Index: ${uv} ${this.toRisk(uv)}`);
      this.updateOccupancyDetected(this.uvIndex, uv > this.uvThreshold);
    }

    // Wind

    this.windDirection?.updateDirection(winddir);
    this.windSpeed?.updateSpeed(windspeedmph, this.platform.config.ws.wind.speedThresold);
    this.windGust?.updateSpeed(windgustmph, this.platform.config.ws.wind.gustThresold);
    this.maxDailyGust?.updateSpeed(maxdailygust, this.platform.config.ws.wind.maxDailyGustThresold);

    // Rain

    this.rainRate?.updateRate(parseFloat(dataReport.rainratein), this.platform.config.ws?.rain?.rateThreshold);
    this.eventRain?.updateTotal(parseFloat(dataReport.eventrainin), this.platform.config.ws?.rain?.eventThreshold);
    this.hourlyRain?.updateTotal(parseFloat(dataReport.hourlyrainin), this.platform.config.ws?.rain?.hourlyThreshold);
    this.dailyRain?.updateTotal(parseFloat(dataReport.dailyrainin), this.platform.config.ws?.rain?.dailyThreshold);
    this.weeklyRain?.updateTotal(parseFloat(dataReport.weeklyrainin), this.platform.config.ws?.rain?.weeklyThreshold);
    this.monthlyRain?.updateTotal(parseFloat(dataReport.monthlyrainin), this.platform.config.ws?.rain?.monthlyThreshold);
    this.yearlyRain?.updateTotal(parseFloat(dataReport.yearlyrainin), this.platform.config.ws?.rain?.yearlyThreshold);
    this.totalRain?.updateTotal(parseFloat(dataReport.totalrainin), undefined);

    // Dew point

    if (this.dewPoint) {
      const t = Utils.toCelcius(dataReport.tempf);
      const rh = parseFloat(dataReport.humidity);
      const dp = Math.pow(rh/100, 1/8) * (112+(0.9*t)) + 0.1*t-112;

      this.dewPoint.updateCharacteristic(
        this.platform.Characteristic.CurrentTemperature,
        dp);
    }
  }

  toRisk(uvIndex) {
    let uvInfo = uvInfos[0];

    for (let i = 1; i < uvInfos.length; i++) {
      if (uvIndex >= uvInfos[i].level) {
        uvInfo = uvInfos[i];
      }
    }

    return uvInfo.risk;
  }
}
