/**
 * StreamDock Plugin Template V1.2.1 Documentation =>
 *
 *      1 => Hot reload support in dev environment => No need to restart server/software when modifying code (restart required for images/config files)!
 *      2 => Auto-package to plugin directory => Use pnpm dev/build to auto-package to plugin directory, no manual copy/delete needed.
 *      3 => Data persistence with reactive views => Use v-model to bind settings values for two-way binding and data persistence!
 *      4 => Perfect integration with Naive UI component library => Adjustable themes, no style penetration needed, 90+ components to help you write less code.
 *
 *      !! Important !! => Automation has many conventions => Please fill in the following content carefully => Happy coding _> </>
 *
 * =========== Kriac =================================================================================== Updated 2024.03.30 ==========>
 */

const Plugin = {
  UUID: 'com.streamdock.dvgamerr.widget',
  version: '1.0.0',
  Icon: 'images/icon.png',
  i18n: {
    en: {
      Name: 'dvgamerr - widget',
      Description: 'Display gold prices from YLG Bullion API'
    },
    zh_CN: {
      Name: 'dvgamerr - widget',
      Description: '显示来自 YLG Bullion API 的黄金价格'
    }
  },
  Software: {
    MinimumVersion: '6.5'
  },
  ApplicationsToMonitor: {
    windows: []
  }
};

// Actions array
const Actions = [
  {
    UUID: 'gold-price',
    Icon: 'images/ylg.png',
    i18n: {
      en: {
        Name: 'Gold Price',
        Tooltip: 'Display current gold price from YLG Bullion'
      },
      zh_CN: {
        Name: '黄金价格',
        Tooltip: '显示 YLG Bullion 的实时金价'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'currency-rate',
    Icon: 'images/yahoo.png',
    i18n: {
      en: {
        Name: 'Currency Rate',
        Tooltip: 'Display currency exchange rates from Yahoo Finance'
      },
      zh_CN: {
        Name: '汇率',
        Tooltip: '显示来自 Yahoo Finance 的货币汇率'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'stock-price',
    Icon: 'images/yahoo.png',
    i18n: {
      en: {
        Name: 'Stock Price',
        Tooltip: 'Display stock prices from Yahoo Finance with profit/loss tracking'
      },
      zh_CN: {
        Name: '股票价格',
        Tooltip: '显示来自 Yahoo Finance 的股票价格及盈亏追踪'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'air-quality',
    Icon: 'images/air-quality.png',
    i18n: {
      en: {
        Name: 'Air Quality',
        Tooltip: 'Monitor US AQI from IQAir location page'
      },
      zh_CN: {
        Name: '空气质量',
        Tooltip: '从 IQAir 页面监测 US AQI 数值'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'claude',
    Icon: 'images/claude.png',
    i18n: {
      en: {
        Name: 'Claude Usage',
        Tooltip: 'Display Claude 5-hour usage and toggle to weekly usage on key press'
      },
      zh_CN: {
        Name: 'Claude 使用量',
        Tooltip: '显示 Claude 5 小时使用量，按键切换到每周使用量'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'powershell',
    Icon: 'images/default.png',
    i18n: {
      en: {
        Name: 'PowerShell',
        Tooltip: 'Run a bundled PowerShell script on key press'
      },
      zh_CN: {
        Name: 'PowerShell 脚本',
        Tooltip: '按键运行内置的 PowerShell 脚本'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'sleep-monitor',
    Icon: 'images/monitor.png',
    i18n: {
      en: {
        Name: 'Sleep Monitor',
        Tooltip: 'Turn off the monitor; icon resets after 1 minute'
      },
      zh_CN: {
        Name: '关闭显示器',
        Tooltip: '关闭显示器，1 分钟后图标自动恢复'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/monitor.png'
      },
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/sleep.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad']
  },
  {
    UUID: 'weather',
    Icon: 'images/default.png',
    i18n: {
      en: {
        Name: 'Weather',
        Tooltip: 'Current weather with temperature, RealFeel® and precipitation chart (Open-Meteo)'
      },
      zh_CN: {
        Name: '天气',
        Tooltip: '显示当前气温、体感温度及降水图表'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'work-hours',
    Icon: 'images/default.png',
    i18n: {
      en: {
        Name: 'Work Hours Clock',
        Tooltip: 'Shows current time and working-hours status (Mon–Fri)'
      },
      zh_CN: {
        Name: '工作时间时钟',
        Tooltip: '显示当前时间及工作状态（周一至周五）'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/default.png'
      }
    ],
    Settings: {},
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad', 'Information']
  },
  {
    UUID: 'toggle-audio',
    Icon: 'images/Soundbar.png',
    i18n: {
      en: {
        Name: 'Toggle Audio Device',
        Tooltip: 'Toggle between two audio playback devices'
      },
      zh_CN: {
        Name: '切换音频设备',
        Tooltip: '在两个音频播放设备之间切换'
      }
    },
    state: 0,
    States: [
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/Soundbar.png'
      },
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/Headphone.png'
      },
      {
        FontSize: '10',
        TitleAlignment: 'bottom',
        Image: 'images/Refresh.png'
      }
    ],
    Settings: {
      device1Match: '*Sound Blaster GS5*',
      device1Show: 'Speakers (GS5)',
      device2Match: '*Sound Blaster X5*',
      device2Show: 'Headphones (X5)'
    },
    UserTitleEnabled: false,
    SupportedInMultiActions: false,
    Controllers: ['Keypad']
  }
];

// !! Do not modify !!
module.exports = {
  PUUID: Plugin.UUID,
  ApplicationsToMonitor: Plugin.ApplicationsToMonitor,
  Software: Plugin.Software,
  Version: Plugin.version,
  CategoryIcon: Plugin.Icon,
  i18n: Plugin.i18n,
  Actions
};
