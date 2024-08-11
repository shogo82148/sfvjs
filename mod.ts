/**
 * InnerList is a list of items defined in RFC 8941 Section 3.1.
 */
export type List = (Item | InnerList)[];

export function encodeList(list: List): string {
  let output = "";
  for (let i = 0; i < list.length; i++) {
    if (i !== 0) {
      output += ", ";
    }
    const item = list[i];
    output += item.toString();
  }
  return output;
}

export function decodeList(...input: string[]): List {
  const state = new DecodeState(...input);
  state.skipSPs();
  const list = state.decodeList();
  state.skipSPs();
  if (state.peek() !== END_OF_INPUT) {
    throw new SyntaxError("unexpected input");
  }
  return list;
}

export type BareItem =
  | Integer
  | Decimal
  | string
  | Token
  | Uint8Array
  | boolean
  | Date;

/**
 * InnerList is a list of items defined in RFC 8941 Section 3.1.1
 */
export class InnerList {
  readonly items: Item[] = [];
  readonly parameters: Parameters;

  constructor(items: Item[], params: Parameters = new Parameters()) {
    this.items = items;
    this.parameters = params;
  }

  toString(): string {
    let output = "(";
    for (const item of this.items) {
      output += item.toString() + " ";
    }
    output = output.trimEnd() + ")";
    output += this.parameters.toString();
    return output;
  }
}

/**
 * Dictionary is a key-value pair collection defined in RFC 8941 Section 3.2.
 */
export class Dictionary {
  private params: Map<string, Item | InnerList> = new Map();

  get size(): number {
    return this.params.size;
  }

  set(key: string, value: Item | InnerList): void {
    validateKey(key);
    this.params.set(key, value);
  }

  get(key: string): Item | InnerList | undefined {
    return this.params.get(key);
  }

  delete(key: string): void {
    this.params.delete(key);
  }

  at(index: number): [string, Item | InnerList] {
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
    let index = 0;
    for (const [key, item] of this.params) {
      if (index !== 0) {
        output += ", ";
      }
      index++;
      output += encodeKey(key);
      if (item instanceof Item && item.value === true) {
        output += item.parameters.toString();
      } else {
        output += "=" + item.toString();
      }
    }
    return output;
  }
}

export function encodeDictionary(dict: Dictionary): string {
  return dict.toString();
}

export function decodeDictionary(...input: string[]): Dictionary {
  const state = new DecodeState(...input);
  state.skipSPs();
  const dict = state.decodeDictionary();
  state.skipSPs();
  if (state.peek() !== END_OF_INPUT) {
    throw new SyntaxError("unexpected input");
  }
  return dict;
}

/**
 * Item is an item defined in RFC 8941 Section 3.3.
 */
export class Item {
  private val: BareItem;
  private params: Parameters;

  constructor(value: BareItem, params: Parameters = new Parameters()) {
    this.val = value;
    this.params = params;
  }

  get value(): BareItem {
    return this.val;
  }

  set value(value: BareItem) {
    if (typeof value === "string") {
      validateString(value);
    }
    this.val = value;
  }

  get parameters(): Parameters {
    return this.params;
  }

  toString(): string {
    return encodeBareItem(this.val) + this.params.toString();
  }
}

export function encodeItem(item: Item): string {
  return item.toString();
}

export function decodeItem(...input: string[]): Item {
  const state = new DecodeState(...input);
  state.skipSPs();
  const item = state.decodeItem();
  state.skipSPs();
  if (state.peek() !== END_OF_INPUT) {
    throw new SyntaxError("unexpected input");
  }
  return item;
}

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
    validateString(value);
    return `"${value.replace(/([\\"])/g, "\\$1")}"`;
  }
  if (value instanceof Token) {
    return value.toString();
  }
  if (value instanceof Uint8Array) {
    return `:${btoa(String.fromCharCode(...value))}:`;
  }
  if (typeof value === "boolean") {
    return value ? "?1" : "?0";
  }
  if (value instanceof Date) {
    return `@${Math.floor(value.getTime() / 1000)}`;
  }
  throw new TypeError("unsupported value type");
}

function validateString(value: string): void {
  if (!/^[\x20-\x7e]*$/.test(value)) {
    throw new TypeError("string contains invalid characters");
  }
}

/**
 * Integer is an integer number defined in RFC 8941 Section 3.3.1.
 */
export class Integer {
  static readonly MAX_VALUE = 999999999999999;
  static readonly MIN_VALUE = -999999999999999;

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
        `value must be between ${Integer.MIN_VALUE} and ${Integer.MAX_VALUE}`,
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
  static readonly MAX_VALUE = 999999999999.9993896484375;
  static readonly MIN_VALUE = -999999999999.9993896484375;

  private value: number;
  private str: string;

  constructor(value: number) {
    if (Number.isNaN(value)) {
      throw new TypeError("value must be a number");
    }
    if (value < Decimal.MIN_VALUE || value > Decimal.MAX_VALUE) {
      throw new RangeError(
        `value must be between -999999999999.999 and 999999999999.999`,
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

const END_OF_INPUT = "end of input";

function isDigit(c: string): boolean {
  return /^[0-9]$/.test(c);
}

class DecodeState {
  private pos = 0;
  private readonly input: string[];

  constructor(...input: string[]) {
    this.input = [...input.join(",")];
  }

  peek(): string {
    if (this.pos >= this.input.length) {
      return END_OF_INPUT;
    }
    return this.input[this.pos];
  }

  next(): void {
    this.pos++;
  }

  skipSPs(): void {
    while (this.peek() === " ") {
      this.next();
    }
  }

  // skipOWS skips OWS in RFC 7230
  skipOWS(): void {
    while (this.peek() === " " || this.peek() === "\t") {
      this.next();
    }
  }

  errUnexpectedCharacter(): never {
    const ch = this.peek();
    if (ch === END_OF_INPUT) {
      throw new SyntaxError("unexpected end of input");
    }
    throw new SyntaxError(`unexpected character at ${this.pos}`);
  }

  // decodeItem parses an Item according to RFC 8941 Section 4.2.3.
  decodeItem(): Item {
    const value = this.decodeBareItem();
    const params = this.decodeParameters();
    return new Item(value, params);
  }

  // decodeBareItem parses a bare item according to RFC 8941 Section 4.2.3.1.
  decodeBareItem(): BareItem {
    const ch = this.peek();
    if (ch === "-" || isDigit(ch)) {
      // an integer or a decimal
      return this.decodeIntegerOrDecimal();
    }

    if (ch === '"') {
      // a string
      return this.decodeString();
    }

    if (/^[a-zA-Z*]$/.test(ch)) {
      // a token
      return this.decodeToken();
    }

    if (ch === ":") {
      // a byte sequence
      return this.decodeByteSequence();
    }

    if (ch === "?") {
      // a boolean
      return this.decodeBoolean();
    }

    if (ch === "@") {
      // a date
      return this.decodeDate();
    }

    this.errUnexpectedCharacter();
  }

  // decodeIntegerOrDecimal parses an integer or a decimal according to RFC 8941 Section 4.2.4.
  decodeIntegerOrDecimal(): Integer | Decimal {
    let ch = this.peek();
    let neg = false;
    if (ch === "-") {
      neg = true;
      this.next();
      if (!isDigit(this.peek())) {
        this.errUnexpectedCharacter();
      }
    }

    let num = 0;
    let cnt = 0;
    for (;;) {
      const ch = this.peek();
      if (!isDigit(ch)) {
        break;
      }
      this.next();
      num = num * 10 + Number(ch);
      cnt++;
      if (cnt > 15) {
        throw new SyntaxError("number is too long");
      }
    }
    if (this.peek() !== ".") {
      // it is an integer
      if (neg) {
        num *= -1;
      }
      return new Integer(num);
    }
    this.next(); // skip "."

    // it might be a decimal
    if (cnt > 12) {
      throw new SyntaxError("number is too long");
    }

    let frac = 0;
    ch = this.peek();
    if (!isDigit(ch)) {
      // fractional part MUST NOT be empty.
      this.errUnexpectedCharacter();
    }
    this.next();
    frac = frac * 10 + Number(ch);

    ch = this.peek();
    if (!isDigit(ch)) {
      let ret = num + frac / 10;
      if (neg) {
        ret *= -1;
      }
      return new Decimal(ret);
    }
    this.next();
    frac = frac * 10 + Number(ch);

    ch = this.peek();
    if (!isDigit(ch)) {
      let ret = num + frac / 100;
      if (neg) {
        ret *= -1;
      }
      return new Decimal(ret);
    }
    this.next();
    frac = frac * 10 + Number(ch);

    ch = this.peek();
    if (!isDigit(ch)) {
      let ret = num + frac / 1000;
      if (neg) {
        ret *= -1;
      }
      return new Decimal(ret);
    }
    this.next();
    frac = frac * 10 + Number(ch);

    throw new SyntaxError("number is too long");
  }

  // decodeList parses a list according to RFC 8941 Section 4.2.1.
  decodeList(): List {
    const members: List = [];

    if (this.peek() === END_OF_INPUT) {
      return members;
    }

    for (;;) {
      const item = this.decodeItemOrInnerList();
      members.push(item);
      this.skipOWS();
      if (this.peek() === END_OF_INPUT) {
        break;
      }
      if (this.peek() !== ",") {
        this.errUnexpectedCharacter();
      }
      this.next(); // skip ","
      this.skipOWS();
      if (this.peek() === END_OF_INPUT) {
        throw new SyntaxError("unexpected end of input");
      }
    }
    return members;
  }

  // decodeItemOrInnerList parses an item or an inner list according to RFC 8941 Section 4.2.1.1.
  decodeItemOrInnerList(): Item | InnerList {
    if (this.peek() === "(") {
      return this.decodeInnerList();
    }
    return this.decodeItem();
  }

  // decodeInnerList parses an inner list according to RFC 8941 Section 4.2.1.2.
  decodeInnerList(): InnerList {
    if (this.peek() !== "(") {
      this.errUnexpectedCharacter();
    }
    this.next(); // skip "("

    const items: Item[] = [];
    for (;;) {
      this.skipSPs();
      if (this.peek() === ")") {
        this.next(); // skip ")"
        break;
      }
      const item = this.decodeItem();
      items.push(item);
      if (this.peek() !== " " && this.peek() !== ")") {
        throw new SyntaxError("unexpected end of input");
      }
    }
    const params = this.decodeParameters();
    return new InnerList(items, params);
  }

  // decodeDictionary parses a dictionary according to RFC 8941 Section 4.2.2.
  decodeDictionary(): Dictionary {
    const dict = new Dictionary();

    if (this.peek() === END_OF_INPUT) {
      return dict;
    }

    for (;;) {
      const key = this.decodeKey();
      if (this.peek() === "=") {
        this.next(); // skip "="
        const value = this.decodeItemOrInnerList();
        dict.set(key, value);
      } else {
        const params = this.decodeParameters();
        dict.set(key, new Item(true, params));
      }

      this.skipOWS();
      if (this.peek() === END_OF_INPUT) {
        break;
      }
      if (this.peek() !== ",") {
        this.errUnexpectedCharacter();
      }
      this.next(); // skip ","
      this.skipOWS();
      if (this.peek() === END_OF_INPUT) {
        throw new SyntaxError("unexpected end of input");
      }
    }
    return dict;
  }

  // decodeParameters parses parameters according to RFC 8941 Section 4.2.3.2.
  decodeParameters(): Parameters {
    const params = new Parameters();
    for (;;) {
      if (this.peek() !== ";") {
        break;
      }
      this.next(); // skip ";"
      this.skipSPs();

      const key = this.decodeKey();
      if (this.peek() === "=") {
        this.next(); // skip "="
        const value = this.decodeBareItem();
        params.set(key, value);
      } else {
        params.set(key, true);
      }
    }
    return params;
  }

  // decodeKey parses a key according to RFC 8941 Section 4.2.3.3.
  decodeKey(): string {
    if (!/^[a-zA-Z*]$/.test(this.peek())) {
      this.errUnexpectedCharacter();
    }

    let key = "";
    for (;;) {
      const ch = this.peek();
      if (!/^[-a-zA-Z0-9_.*]$/.test(ch)) {
        break;
      }
      key += ch;
      this.next();
    }
    return key;
  }

  // decodeString parses a string according to RFC 8941 Section 4.2.5.
  decodeString(): string {
    if (this.peek() !== '"') {
      this.errUnexpectedCharacter();
    }
    this.next(); // skip '"'

    let str = "";
    for (;;) {
      const ch = this.peek();
      if (ch === "\\") {
        this.next(); // skip "\\"
        if (this.peek() === "\\" || this.peek() === '"') {
          str += this.peek();
          this.next();
          continue;
        }
        this.errUnexpectedCharacter();
      }
      if (ch === '"') {
        this.next(); // skip '"'
        return str;
      }
      if (/^[\x20-\x7e]$/.test(ch)) {
        str += ch;
        this.next();
        continue;
      }
      this.errUnexpectedCharacter();
    }
  }

  // decodeToken parses a Token according to RFC 8941 Section 4.2.6.
  decodeToken(): Token {
    let token = "";
    for (;;) {
      const ch = this.peek();
      if (ch === END_OF_INPUT) {
        break;
      }
      if (!/^[-0-9a-zA-Z!#$%&'*+.^_`|~:/]$/.test(ch)) {
        break;
      }
      token += ch;
      this.next();
    }
    return new Token(token);
  }

  // decodeByteSequence parses a byte sequence according to RFC 8941 Section 4.2.7.
  decodeByteSequence(): Uint8Array {
    if (this.peek() !== ":") {
      this.errUnexpectedCharacter();
    }
    this.next(); // skip ":"

    let bytes = "";
    for (;;) {
      const ch = this.peek();
      if (ch === END_OF_INPUT) {
        break;
      }
      if (ch === ":") {
        this.next(); // skip ":"
        return new Uint8Array(
          atob(bytes)
            .split("")
            .map((c) => c.charCodeAt(0)),
        );
      }
      if (!/^[A-Za-z0-9+/=]$/.test(ch)) {
        this.errUnexpectedCharacter();
      }
      bytes += ch;
      this.next();
    }
    throw new SyntaxError("unexpected end of input");
  }

  // decodeBoolean parses a boolean according to RFC 8941 Section 4.2.8.
  decodeBoolean(): boolean {
    if (this.peek() !== "?") {
      this.errUnexpectedCharacter();
    }
    this.next(); // skip "?"
    const ch = this.peek();
    if (ch === "0") {
      this.next();
      return false;
    }
    if (ch === "1") {
      this.next();
      return true;
    }
    this.errUnexpectedCharacter();
  }

  // decodeDate parses a date according to https://datatracker.ietf.org/doc/html/draft-ietf-httpbis-sfbis-06#name-parsing-a-date
  decodeDate(): Date {
    if (this.peek() !== "@") {
      this.errUnexpectedCharacter();
    }
    this.next(); // skip "@"

    let neg = false;
    if (this.peek() === "-") {
      neg = true;
      this.next(); // skip "-"
    }

    if (!isDigit(this.peek())) {
      this.errUnexpectedCharacter();
    }

    let num = 0;
    let cnt = 0;
    for (;;) {
      const ch = this.peek();
      if (!isDigit(ch)) {
        break;
      }
      this.next();
      num = num * 10 + Number(ch);
      cnt++;
      if (cnt > 15) {
        throw new SyntaxError("number is too long");
      }
    }

    if (this.peek() === ".") {
      this.errUnexpectedCharacter();
    }
    if (neg) {
      num *= -1;
    }
    return new Date(num * 1000);
  }
}
