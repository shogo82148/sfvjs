import { assertEquals } from "jsr:@std/assert";
import {
  BareItem,
  Decimal,
  decodeItem,
  decodeList,
  encodeItem,
  encodeList,
  InnerList,
  Integer,
  Item,
  List,
  Parameters,
} from "./mod.ts";
import testDataNumber from "./structured-field-tests/number.json" with {
  type: "json",
};
import testDataNumberGenerated from "./structured-field-tests/number-generated.json" with {
  type: "json",
};
import testDataList from "./structured-field-tests/list.json" with {
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

Deno.test("number-generated", () => {
  for (const data of testDataNumberGenerated) {
    test(data);
  }
});

Deno.test("list", () => {
  for (const data of testDataList) {
    test(data);
  }
});

function test(data: TestData) {
  console.log(data.name);
  switch (data.header_type) {
    case "item":
      {
        let item: Item;
        try {
          item = decodeItem(...data.raw);
        } catch (e) {
          if (e instanceof DataSetError) {
            throw e;
          }
          if (data.must_fail) {
            return;
          }
          throw e;
        }
        if (data.must_fail) {
          throw new Error("unexpected success");
        }
        const actual = convertItem(item);
        assertEquals(actual, data.expected, data.name);
        if (data.canonical) {
          const encoded = encodeItem(item);
          assertEquals([encoded], data.canonical, data.name);
        }
      }
      break;
    case "list":
      {
        let list: List;
        try {
          list = decodeList(...data.raw);
        } catch (e) {
          if (e instanceof DataSetError) {
            throw e;
          }
          if (data.must_fail) {
            return;
          }
          throw e;
        }
        if (data.must_fail) {
          throw new Error("unexpected success");
        }
        const actual = convertList(list);
        assertEquals(actual, data.expected, data.name);
        if (data.canonical) {
          const encoded = encodeList(list);
          const canonical = data.canonical.join(",");
          assertEquals(encoded, canonical, data.name);
        }
      }
      break;
    default:
      throw new DataSetError(`unsupported header type: ${data.header_type}`);
  }
}

function convertItem(item: Item) {
  return [
    convertBareItem(item.value),
    convertParameters(item.parameters),
  ];
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

function convertList(list: List) {
  return list.map(convertItemOrInnerList);
}

function convertItemOrInnerList(item: Item | InnerList) {
  if (item instanceof Item) {
    return convertItem(item);
  }
  if (item instanceof InnerList) {
    return convertInnerList(item);
  }
  throw new DataSetError(`unsupported type: ${typeof item}`);
}

function convertInnerList(list: InnerList) {
  return [
    list.items.map(convertItem),
    convertParameters(list.parameters),
  ];
}
