import { assertEquals } from "jsr:@std/assert";
import { Item, Integer, Decimal, BareItem, Parameters } from "./mod.ts";
import testDataNumber from "./structured-field-tests/serialisation-tests/number.json" with { type: "json" };

class DataSetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataSetError";
  }
}

Deno.test("number", () => {
  for (const data of testDataNumber) {
    console.log(data.name);
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
      assertEquals(failed, true);
    } else {
      assertEquals(failed, false);
      assertEquals(canonical, data.canonical);
    }
  }
});

function convertToItem(data: unknown): Item {
  if (!(data instanceof Array)) {
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
  if (typeof data === "number") {
    if (Number.isInteger(data)) {
      return new Integer(data);
    } else {
      return new Decimal(data);
    }
  }
  throw new DataSetError("unknown type");
}

function convertParameters(data: unknown): Parameters {
  if (!(data instanceof Array)) {
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
