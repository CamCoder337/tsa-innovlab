declare module 'google-libphonenumber' {
  export interface PhoneNumber {
    getCountryCode(): number;
    getNationalNumber(): number;
    getExtension(): string | null;
    getItalianLeadingZero(): boolean;
    getNumberOfLeadingZeros(): number;
    getRawInput(): string;
    getCountryCodeSource(): number;
    getPreferredDomesticCarrierCode(): string;
  }

  export enum PhoneNumberFormat {
    E164 = 0,
    INTERNATIONAL = 1,
    NATIONAL = 2,
    RFC3966 = 3,
  }

  export enum PhoneNumberType {
    FIXED_LINE = 0,
    MOBILE = 1,
    FIXED_LINE_OR_MOBILE = 2,
    TOLL_FREE = 3,
    PREMIUM_RATE = 4,
    SHARED_COST = 5,
    VOIP = 6,
    PERSONAL_NUMBER = 7,
    PAGER = 8,
    UAN = 9,
    VOICEMAIL = 10,
    UNKNOWN = -1,
  }

  export enum ValidationResult {
    IS_POSSIBLE = 0,
    IS_POSSIBLE_LOCAL_ONLY = 4,
    INVALID_COUNTRY_CODE = 1,
    TOO_SHORT = 2,
    INVALID_LENGTH = 5,
    TOO_LONG = 3,
  }

  export class PhoneNumberUtil {
    static getInstance(): PhoneNumberUtil;

    parse(numberToParse: string, defaultRegion?: string): PhoneNumber;
    parseAndKeepRawInput(numberToParse: string, defaultRegion?: string): PhoneNumber;

    format(number: PhoneNumber, numberFormat: PhoneNumberFormat): string;
    formatInOriginalFormat(number: PhoneNumber, regionCallingFrom: string): string;
    formatOutOfCountryCallingNumber(number: PhoneNumber, regionCallingFrom: string): string;

    getNumberType(number: PhoneNumber): PhoneNumberType;
    getRegionCodeForNumber(number: PhoneNumber): string | null;
    getRegionCodeForCountryCode(countryCode: number): string;

    isValidNumber(number: PhoneNumber): boolean;
    isValidNumberForRegion(number: PhoneNumber, regionCode: string): boolean;
    isPossibleNumber(number: PhoneNumber): boolean;
    isPossibleNumberWithReason(number: PhoneNumber): ValidationResult;

    getLengthOfGeographicalAreaCode(number: PhoneNumber): number;
    getLengthOfNationalDestinationCode(number: PhoneNumber): number;

    getCountryCodeForRegion(regionCode: string): number;
    getNddPrefixForRegion(regionCode: string, stripNonDigits: boolean): string | null;

    isNumberMatch(firstNumber: PhoneNumber | string, secondNumber: PhoneNumber | string): number;
    isAlphaNumber(number: string): boolean;
    convertAlphaCharactersInNumber(number: string): string;
    normalizeDigitsOnly(number: string): string;
  }

  const libphonenumber: {
    PhoneNumberUtil: typeof PhoneNumberUtil;
    PhoneNumberFormat: typeof PhoneNumberFormat;
    PhoneNumberType: typeof PhoneNumberType;
    ValidationResult: typeof ValidationResult;
  };

  export default libphonenumber;
}
