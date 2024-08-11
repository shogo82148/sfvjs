import { assertEquals } from "jsr:@std/assert";
import {
  BareItem,
  Decimal,
  Dictionary,
  Integer,
  Item,
  Parameters,
  Token,
} from "./mod.ts";
import testDataNumber from "./structured-field-tests/serialisation-tests/number.json" with {
  type: "json",
};
import testDataStringGenerated from "./structured-field-tests/serialisation-tests/string-generated.json" with {
  type: "json",
};
import testDataTokenGenerated from "./structured-field-tests/serialisation-tests/token-generated.json" with {
  type: "json",
};
import testDataKeyGenerated from "./structured-field-tests/serialisation-tests/key-generated.json" with {
  type: "json",
};

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
  value: string | number;
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

Deno.test("key-generated", () => {
  for (const data of testDataKeyGenerated) {
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
        canonical = [convertToDictionary(data.expected).toString()];
        break;
      case "list":
        canonical = [convertToList(data.expected).toString()];
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
    assertEquals(
      canonical,
      data.canonical,
      `${data.name}: canonical form doesn't match`,
    );
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
  for (const item of data) {
    if (!Array.isArray(item)) {
      throw new DataSetError("invalid parameters");
    }
    if (item.length !== 2) {
      throw new DataSetError("invalid parameters");
    }
    const [key, value] = item;
    params.set(key, convertToBareItem(value));
  }
  return params;
}

function convertToList(data: unknown): Item[] {
  if (!Array.isArray(data)) {
    throw new DataSetError("invalid list");
  }
  const list: Item[] = [];
  for (const item of data) {
    list.push(convertToItem(item));
  }
  return list;
}

function convertToDictionary(data: unknown): Dictionary {
  if (!Array.isArray(data)) {
    throw new DataSetError("invalid dictionary");
  }
  const dict = new Dictionary();
  for (const item of data) {
    if (!Array.isArray(item)) {
      throw new DataSetError("invalid dictionary");
    }
    if (item.length !== 2) {
      throw new DataSetError("invalid dictionary");
    }
    const [key, value] = item;
    dict.set(key, convertToItem(value));
  }
  return dict;
}
