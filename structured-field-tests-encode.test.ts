import { assertEquals } from "jsr:@std/assert";
import { Item, BareItem, Integer, Decimal, Token, Parameters } from "./mod.ts";
import testDataNumber from "./structured-field-tests/serialisation-tests/number.json" with { type: "json" };
import testDataStringGenerated from "./structured-field-tests/serialisation-tests/string-generated.json" with { type: "json" };
import testDataTokenGenerated from "./structured-field-tests/serialisation-tests/token-generated.json" with { type: "json" };

class DataSetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataSetError";
  }
}

interface TestData {
  name: string;
  header_type: string;
  expected: unknown;
  canonical?: string[];
  must_fail?: boolean;
}

interface SFObject {
  __type: string;
  value: string | number
}

Deno.test("number", () => {
  for (const data of testDataNumber) {
    test(data);
  }
});

Deno.test("string-generated", () => {
  for (const data of testDataStringGenerated) {
    test(data);
  }
});

Deno.test("token-generated", () => {
  for (const data of testDataTokenGenerated) {
    test(data);
  }
});

function test(data: TestData) {
  let failed = false;
  let canonical: string[] = [];
  try {
    switch (data.header_type) {
    case "item":
      canonical = [convertToItem(data.expected).toString()];
      break;
    case "dictionary":
      break;
    case "list":
      break;
    default:
      throw new DataSetError("unknown header");
    }
  } catch (e) {
    if (e instanceof DataSetError) {
      throw e;
    }
    failed = true;
  }
  if (data.must_fail) {
    assertEquals(failed, true, `${data.name}: want to fail, but succeeded`);
  } else {
    assertEquals(failed, false, `${data.name}: failed`);
    assertEquals(canonical, data.canonical, `${data.name}: canonical form doesn't match`);
  }
}

function convertToItem(data: unknown): Item {
  if (!Array.isArray(data)) {
    throw new DataSetError("invalid item");
  }
  if (data.length !== 2) {
    throw new DataSetError("invalid item");
  }
  const [bareItem, params] = data;
  const item = new Item(convertToBareItem(bareItem), convertParameters(params));
  return item;
}

function convertToBareItem(data: unknown): BareItem {
  switch (typeof data) {
  case "number":
    if (Number.isInteger(data)) {
      return new Integer(data);
    } else {
      return new Decimal(data);
    }
  case "string":
    return data;
  case "object":
    if (data === null) {
      throw new DataSetError("unknown type");
    }
    {
      const obj = data as SFObject;
      switch (obj.__type) {
      case "token":
        return new Token(obj.value as string);
      }  
    }
  }
  throw new DataSetError("unknown type");
}

function convertParameters(data: unknown): Parameters {
  if (!Array.isArray(data)) {
    throw new DataSetError("invalid parameters");
  }
  const params = new Parameters();
  for (let i = 0; i < data.length; i += 2) {
    const key = data[i];
    const value = data[i +1 ];
    const bareItem = convertToBareItem(value);
    params.set(key, bareItem);
  }
  return params;
}