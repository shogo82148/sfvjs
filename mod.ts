export type BareItem = string | Integer | Decimal | boolean;

/**
 * Parameters is a key-value pair collection.
 */
export class Parameters {
  private params: [string, BareItem][] = [];

  get length(): number {
    return this.params.length;
  }

  set(key: string, value: BareItem): void {
    this.params = this.params.filter(([k]) => k !== key);
    this.params.push([key, value]);
  }

  get(key: string): BareItem | undefined {
    return this.params.find(([k]) => k === key)?.[1];
  }

  delete(key: string): void {
    this.params = this.params.filter(([k]) => k !== key);
  }

  at(index: number): [string, BareItem] | undefined {
    return this.params[index];
  }

  [Symbol.iterator]() {
    return this.params[Symbol.iterator]();
  }
}

/**
 * Integer is an integer number defined in RFC 8941 Section 3.3.1.
 */
export class Integer {
  static MAX_VALUE = 999999999999999;
  static MIN_VALUE = -999999999999999;

  private value: number;

  constructor(value: number) {
    if (Number.isNaN(value)) {
      throw new TypeError("value must be a number");
    }
    if (!Number.isInteger(value)) {
      throw new TypeError("value must be an integer");
    }
    if (value < Integer.MIN_VALUE || value > Integer.MAX_VALUE) {
      throw new RangeError(
        `value must be between ${Integer.MIN_VALUE} and ${Integer.MAX_VALUE}`
      );
    }
    this.value = value;
  }

  toString(): string {
    return `${this.value}`;
  }

  valueOf(): number {
    return this.value;
  }
}

/**
 * Decimal is a decimal number defined in RFC 8941 Section 3.3.2.
 */
export class Decimal {
  static MAX_VALUE = 999999999999.9993896484375;
  static MIN_VALUE = -999999999999.9993896484375;

  private value: number;
  private str: string;

  constructor(value: number) {
    if (Number.isNaN(value)) {
      throw new TypeError("value must be a number");
    }
    if (value < Decimal.MIN_VALUE || value > Decimal.MAX_VALUE) {
      throw new RangeError(
        `value must be between -999999999999.999 and 999999999999.999`
      );
    }
    this.str = Decimal.floatToString(value);
    this.value = Number.parseFloat(this.str);
  }

  private static floatToString(value: number): string {
    let str = "";
    let i = roundToEven(value * 1000);

    // write the sign
    if (i < 0) {
      str += "-";
      i = -i;
    }
    // integer component
    str += `${Math.floor(i / 1000)}.`;

    // fractional component
    i = i % 1000;
    str += `${Math.floor(i / 100)}`;
    i = i % 100;
    if (i === 0) {
      return str; // omit trailing zeros
    }
    str += `${Math.floor(i / 10)}`;
    i = i % 10;
    if (i === 0) {
      return str;
    }
    str += `${i}`;
    return str; // omit trailing zeros
  }

  toString(): string {
    return this.str;
  }

  valueOf(): number {
    return this.value;
  }
}

function roundToEven(value: number): number {
  const floor = Math.floor(value);
  if (value - floor === 0.5) {
    return floor % 2 === 0 ? floor : floor + 1;
  }
  return Math.round(value);
}
