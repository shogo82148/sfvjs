import { assertEquals } from "jsr:@std/assert";
import { BareItem, decodeItem, Integer, Decimal, Item, Parameters, encodeItem } from "./mod.ts";
import testDataNumber from "./structured-field-tests/number.json" with { type: "json" };

class DataSetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataSetError";
  }
}

interface TestData {
  name: string;
  raw: string[];
  header_type: string;
  expected?: unknown;
  canonical?: string[];
  must_fail?: boolean;
}

Deno.test("number", () => {
  for (const data of testDataNumber) {
    test(data);
  }
});

function test(data: TestData) {
  let failed = false;
  try {
    switch (data.header_type) {
    case "item":
      {
        const item = decodeItem(...data.raw);
        const actual = convertItem(item);
        assertEquals(actual, data.expected, data.name);
        if (data.canonical) {
          const encoded = encodeItem(item);
          assertEquals([encoded], data.canonical, data.name);
        }
      }
      break;
    default:
      throw new DataSetError(`unsupported header type: ${data.header_type}`);
    }
  } catch (e) {
    if (e instanceof DataSetError) {
      throw e;
    }
    failed = true;
  }
  if (data.must_fail) {
    assertEquals(failed, true, `${data.name} must fail, but succeeded`);
    return;
  }
  assertEquals(failed, false, `${data.name} must succeed, but failed`);
}

function convertItem(item: Item) {
  return [
    convertBareItem(item.value),
    convertParameters(item.parameters),
  ]
}

function convertBareItem(item: BareItem) {
  switch (typeof item) {
  case "string":
    return item;
  case "boolean":
    return item;
  case "object":
    if (item instanceof Integer) {
      return item.valueOf();
    }
    if (item instanceof Decimal) {
      return item.valueOf();
    }
    throw new DataSetError(`unsupported type: ${typeof item}`);
  default:
    throw new DataSetError(`unsupported type: ${typeof item}`);
  }
}

function convertParameters(params: Parameters) {
  const result = [];
  for (const [key, value] of params) {
    result.push([key, convertBareItem(value)]);
  }
  return result;
}
