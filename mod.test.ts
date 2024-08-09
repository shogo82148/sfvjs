import { assertEquals, assertThrows } from "jsr:@std/assert";
import { Parameters, Integer, Decimal } from "./mod.ts";

Deno.test("parameters", () => {
  const params = new Parameters();
  assertEquals(params.get("foo"), undefined);
  assertEquals(params.get("baz"), undefined);
  params.set("foo", "bar");
  params.set("baz", "qux");

  assertEquals(params.length, 2, "length");

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
  assertEquals(params.toString(), `;foo="bar";baz="qux"`);
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
    "value must be between -999999999999999 and 999999999999999"
  );
  assertThrows(
    () => new Integer(-999999999999999 - 1),
    RangeError,
    "value must be between -999999999999999 and 999999999999999"
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
    "value must be between -999999999999.999 and 999999999999.999"
  );
  assertThrows(
    () => new Decimal(-999999999999.99951171875),
    RangeError,
    "value must be between -999999999999.999 and 999999999999.999"
  );
});

Deno.test;
