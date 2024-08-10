export type BareItem = Token | string | Integer | Decimal | boolean;

/**
 * Parameters is a key-value pair collection.
 */
export class Parameters {
  private params: Map<string, BareItem> = new Map();

  get size(): number {
    return this.params.size;
  }

  set(key: string, value: BareItem): void {
    validateKey(key);
    this.params.set(key, value);
  }

  get(key: string): BareItem | undefined {
    return this.params.get(key);
  }

  delete(key: string): void {
    this.params.delete(key);
  }

  at(index: number): [string, BareItem] {
    let i = 0;
    if (index < 0 || index >= this.params.size) {
      throw new RangeError("index out of range");
    }
    for (const [key, value] of this.params) {
      if (i === index) {
        return [key, value];
      }
      i++;
    }
    throw new RangeError("index out of range");
  }

  [Symbol.iterator]() {
    return this.params[Symbol.iterator]();
  }

  toString(): string {
    // serialize the parameter using the algorithm defined in RFC 8941 Section 4.1.1.2.
    let output = "";
    for (const [key, value] of this.params) {
      output += ";";
      output += encodeKey(key);
      if (value === true) {
        continue;
      }
      output += "=" + encodeBareItem(value);
    }
    return output;
  }
}

function validateKey(key: string): void {
  if (!/^[a-z*][-a-z0-9-_.*]*$/.test(key)) {
    throw new TypeError("key contains invalid characters");
  }
}

// encodeKey encodes the key in accordance with RFC 8941 Section 4.1.1.3.
function encodeKey(key: string): string {
  validateKey(key);
  return key;
}

// encodeBareItem encodes the bare item in accordance with RFC 8941 Section 4.1.3.1.
function encodeBareItem(value: BareItem): string {
  if (value instanceof Integer) {
    return value.toString();
  }
  if (value instanceof Decimal) {
    return value.toString();
  }
  if (typeof value === "string") {
    if (!/^[\x20-\x7e]*$/.test(value)) {
      throw new TypeError("string contains invalid characters");
    }
    return `"${value.replace(/([\\"])/g, "\\$1")}"`;
  }
  if (value instanceof Token) {
    return value.toString();
  }
  // TODO: serialize ByteSequence
  if (typeof value === "boolean") {
    return value ? "?1" : "?0";
  }
  throw new TypeError("unsupported value type");
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

export class Token {
  private value: string;

  constructor(value: string) {
    validateToken(value);
    this.value = value;
  }

  toString(): string {
    // serialize the token using algorithm defined in RFC 8941 Section 4.1.7.
    return this.value;
  }

  valueOf(): string {
    return this.value;
  }
}

function validateToken(value: string): void {
  if (!/^[a-zA-Z*][-0-9a-zA-Z!#$%&'*+.^_`|~:/]*$/.test(value)) {
    throw new TypeError("token contains invalid characters");
  }
}
