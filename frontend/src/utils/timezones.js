/**
 * Curated list of ~28 common IANA timezones for the timezone dropdown.
 * Used in FlightsEditPage (departure/arrival timezone) and StaysEditPage (check-in/out timezone).
 *
 * Ordered roughly West to East by UTC offset.
 * Display format: "Abbreviation — Description" with IANA identifier as the value.
 */

export const TIMEZONES = [
  { label: 'HST — Hawaii Time', value: 'Pacific/Honolulu' },
  { label: 'AKT — Alaska Time', value: 'America/Anchorage' },
  { label: 'PT — Pacific Time', value: 'America/Los_Angeles' },
  { label: 'PT — Pacific Time (Vancouver)', value: 'America/Vancouver' },
  { label: 'MT — Mountain Time', value: 'America/Denver' },
  { label: 'CT — Central Time', value: 'America/Chicago' },
  { label: 'ET — Eastern Time', value: 'America/New_York' },
  { label: 'ET — Eastern Time (Toronto)', value: 'America/Toronto' },
  { label: 'BRT — Brasília Time', value: 'America/Sao_Paulo' },
  { label: 'GMT/BST — London', value: 'Europe/London' },
  { label: 'CET — Central European', value: 'Europe/Paris' },
  { label: 'CET — Central European (Berlin)', value: 'Europe/Berlin' },
  { label: 'CET — Central European (Rome)', value: 'Europe/Rome' },
  { label: 'CET — Central European (Madrid)', value: 'Europe/Madrid' },
  { label: 'CET — Central European (Amsterdam)', value: 'Europe/Amsterdam' },
  { label: 'MSK — Moscow Standard Time', value: 'Europe/Moscow' },
  { label: 'GST — Gulf Standard Time', value: 'Asia/Dubai' },
  { label: 'IST — India Standard Time', value: 'Asia/Kolkata' },
  { label: 'ICT — Indochina Time', value: 'Asia/Bangkok' },
  { label: 'WIB — West Indonesia Time', value: 'Asia/Jakarta' },
  { label: 'SGT — Singapore Time', value: 'Asia/Singapore' },
  { label: 'CST — China Standard Time', value: 'Asia/Shanghai' },
  { label: 'KST — Korea Standard Time', value: 'Asia/Seoul' },
  { label: 'JST — Japan Standard Time', value: 'Asia/Tokyo' },
  { label: 'AEDT/AEST — Eastern Australia', value: 'Australia/Sydney' },
  { label: 'AEDT/AEST — Eastern Australia (Melbourne)', value: 'Australia/Melbourne' },
  { label: 'NZDT/NZST — New Zealand', value: 'Pacific/Auckland' },
];

export default TIMEZONES;
