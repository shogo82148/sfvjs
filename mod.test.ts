import { assertEquals, assertThrows } from "jsr:@std/assert";
import {
  Decimal,
  Dictionary,
  DisplayString,
  encodeDictionary,
  encodeList,
  InnerList,
  Integer,
  Item,
  type List,
  Parameters,
  Token,
} from "./mod.ts";

Deno.test("list", () => {
  const list: List = [];
  list.push(new Item(new Token("sugar")));
  list.push(new Item(new Token("tea")));
  list.push(new Item(new Token("rum")));
  assertEquals(encodeList(list), "sugar, tea, rum");
});

Deno.test("inner list", () => {
  const list = new InnerList([new Item("foo"), new Item("bar")]);
  assertEquals(list.items.length, 2);
  assertEquals(list.items[0].value, "foo");
  assertEquals(list.items[1].value, "bar");
  assertEquals(list.parameters.size, 0);
  assertEquals(list.toString(), '("foo" "bar")');
});

Deno.test("dictionary", () => {
  const dict = new Dictionary();
  dict.set("a", new Item(false));
  dict.set("b", new Item(true));
  dict.set("c", new Item(true, new Parameters([["foo", new Token("bar")]])));
  assertEquals(dict.size, 3);
  assertEquals(encodeDictionary(dict), "a=?0, b, c;foo=bar");
});

Deno.test("dictionary: initialize", () => {
  const dict = new Dictionary([
    ["a", new Item(false)],
    ["b", new Item(true)],
    ["c", new Item(true, new Parameters([["foo", new Token("bar")]]))],
  ]);
  assertEquals(dict.size, 3);
  assertEquals(encodeDictionary(dict), "a=?0, b, c;foo=bar");
});

Deno.test("item", () => {
  const item = new Item("foo");
  assertEquals(item.value, "foo");
  assertEquals(item.parameters.size, 0);
  assertEquals(item.toString(), '"foo"');
});

Deno.test("parameters", () => {
  const params = new Parameters();
  assertEquals(params.get("foo"), undefined);
  assertEquals(params.get("baz"), undefined);
  params.set("foo", "bar");
  params.set("baz", "qux");

  assertEquals(params.size, 2, "length");

  // search values by keys
  assertEquals(params.get("foo"), "bar");
  assertEquals(params.get("baz"), "qux");

  // search values by index
  assertEquals(params.at(0), ["foo", "bar"]);
  assertEquals(params.at(1), ["baz", "qux"]);

  // iterate over values
  const values = [...params];
  assertEquals(values, [
    ["foo", "bar"],
    ["baz", "qux"],
  ]);

  // serialize to string
  assertEquals(params.toString(), ';foo="bar";baz="qux"');
});

Deno.test("parameters: initialize", () => {
  const params = new Parameters([
    ["foo", "bar"],
    ["baz", "qux"],
  ]);

  // iterate over values
  const values = [...params];
  assertEquals(values, [
    ["foo", "bar"],
    ["baz", "qux"],
  ]);

  // serialize to string
  assertEquals(params.toString(), ';foo="bar";baz="qux"');
});

Deno.test("parameters: order", () => {
  const params = new Parameters();
  params.set("foo", "bar");
  params.set("baz", "qux");
  params.set("foo", "quux"); // update value

  // search values by index
  assertThrows(() => params.at(2), RangeError, "index out of range");
  assertEquals(params.at(0), ["foo", "quux"]);
  assertEquals(params.at(1), ["baz", "qux"]);

  // iterate over values
  const values = [...params];
  assertEquals(values, [
    ["foo", "quux"],
    ["baz", "qux"],
  ]);
});

Deno.test("parameters: set", () => {
  const params = new Parameters();
  params.set("a", "1");
  params.set("b", "2");
  params.set("a", "3");

  // iterate over values
  const values = [...params];
  assertEquals(values, [
    ["a", "3"],
    ["b", "2"],
  ]);
});

Deno.test("parameters: delete", () => {
  const params = new Parameters();
  params.set("a", "1");
  params.set("b", "2");
  params.delete("a");

  // iterate over values
  const values = [...params];
  assertEquals(values, [
    ["b", "2"],
  ]);
});

Deno.test("integer", () => {
  const i = new Integer(42);
  assertEquals(i.toString(), "42");
  assertEquals(i.valueOf(), 42);
});

Deno.test("integer: max", () => {
  const i = new Integer(999999999999999);
  assertEquals(i.toString(), "999999999999999");
  assertEquals(i.valueOf(), 999999999999999);
});

Deno.test("integer: min", () => {
  const i = new Integer(-999999999999999);
  assertEquals(i.toString(), "-999999999999999");
  assertEquals(i.valueOf(), -999999999999999);
});

Deno.test("integer: NaN", () => {
  assertThrows(() => new Integer(NaN), TypeError, "value must be a number");
});

Deno.test("integer: not integer", () => {
  assertThrows(() => new Integer(42.1), TypeError, "value must be an integer");
});

Deno.test("integer: out of range", () => {
  assertThrows(
    () => new Integer(999999999999999 + 1),
    RangeError,
    "value must be between -999999999999999 and 999999999999999",
  );
  assertThrows(
    () => new Integer(-999999999999999 - 1),
    RangeError,
    "value must be between -999999999999999 and 999999999999999",
  );
});

Deno.test("decimal", () => {
  const d = new Decimal(42.1);
  assertEquals(d.toString(), "42.1");
  assertEquals(d.valueOf(), 42.1);
});

Deno.test("decimal: max", () => {
  const d = new Decimal(999999999999.9993896484375);
  assertEquals(d.toString(), "999999999999.999");
  assertEquals(d.valueOf(), 999999999999.999);
});

Deno.test("decimal: min", () => {
  const d = new Decimal(-999999999999.9993896484375);
  assertEquals(d.toString(), "-999999999999.999");
  assertEquals(d.valueOf(), -999999999999.999);
});

Deno.test("decimal: NaN", () => {
  assertThrows(() => new Decimal(NaN), TypeError, "value must be a number");
});

Deno.test("decimal: out of range", () => {
  assertThrows(
    () => new Decimal(999999999999.99951171875),
    RangeError,
    "value must be between -999999999999.999 and 999999999999.999",
  );
  assertThrows(
    () => new Decimal(-999999999999.99951171875),
    RangeError,
    "value must be between -999999999999.999 and 999999999999.999",
  );
});

Deno.test("token", () => {
  const token = new Token("foo");
  assertEquals(token.toString(), "foo");
});

Deno.test("byte sequences", () => {
  const bytes = new Uint8Array([0x66, 0x6f, 0x6f]);
  const item = new Item(bytes);
  assertEquals(item.toString(), ":Zm9v:");
});

Deno.test("date", () => {
  const date = new Date(999);
  const item = new Item(date);
  assertEquals(item.toString(), "@0");
});

Deno.test("display string", () => {
  const displayString = new DisplayString("foo");
  assertEquals(displayString.toString(), '%"foo"');
  assertEquals(displayString.valueOf(), "foo");
});
