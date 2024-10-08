import { assertEquals } from "jsr:@std/assert";
import {
  type BareItem,
  Decimal,
  decodeDictionary,
  decodeItem,
  decodeList,
  type Dictionary,
  DisplayString,
  encodeDictionary,
  encodeItem,
  encodeList,
  InnerList,
  Integer,
  Item,
  type List,
  type Parameters,
  Token,
} from "./mod.ts";
import testDataExamples from "./structured-field-tests/examples.json" with {
  type: "json",
};
import testDataList from "./structured-field-tests/list.json" with {
  type: "json",
};
import testDataParamList from "./structured-field-tests/param-list.json" with {
  type: "json",
};
import testDataListList from "./structured-field-tests/listlist.json" with {
  type: "json",
};
import testDataParamListList from "./structured-field-tests/param-listlist.json" with {
  type: "json",
};
import testDataDictionary from "./structured-field-tests/dictionary.json" with {
  type: "json",
};
import testDataParamDict from "./structured-field-tests/param-dict.json" with {
  type: "json",
};
import testDataNumber from "./structured-field-tests/number.json" with {
  type: "json",
};
import testDataNumberGenerated from "./structured-field-tests/number-generated.json" with {
  type: "json",
};
import testDataString from "./structured-field-tests/string.json" with {
  type: "json",
};
import testDataStringGenerated from "./structured-field-tests/string-generated.json" with {
  type: "json",
};
import testDataToken from "./structured-field-tests/token.json" with {
  type: "json",
};
import testDataTokenGenerated from "./structured-field-tests/token-generated.json" with {
  type: "json",
};
import testDataBinary from "./structured-field-tests/binary.json" with {
  type: "json",
};
import testDataBoolean from "./structured-field-tests/boolean.json" with {
  type: "json",
};
import testDataLargeGenerated from "./structured-field-tests/large-generated.json" with {
  type: "json",
};
import testDataDate from "./structured-field-tests/date.json" with {
  type: "json",
};
import testDisplayString from "./structured-field-tests/display-string.json" with {
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

Deno.test("examples", () => {
  for (const data of testDataExamples) {
    test(data);
  }
});

Deno.test("list", () => {
  for (const data of testDataList) {
    test(data);
  }
});

Deno.test("param-list", () => {
  for (const data of testDataParamList) {
    test(data);
  }
});

Deno.test("listlist", () => {
  for (const data of testDataListList) {
    test(data);
  }
});

Deno.test("param-listlist", () => {
  for (const data of testDataParamListList) {
    test(data);
  }
});

Deno.test("dictionary", () => {
  for (const data of testDataDictionary) {
    test(data);
  }
});

Deno.test("param-dict", () => {
  for (const data of testDataParamDict) {
    test(data);
  }
});

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

Deno.test("string", () => {
  for (const data of testDataString) {
    test(data);
  }
});

Deno.test("string-generated", () => {
  for (const data of testDataStringGenerated) {
    test(data);
  }
});

Deno.test("token", () => {
  for (const data of testDataToken) {
    test(data);
  }
});

Deno.test("token-generated", () => {
  for (const data of testDataTokenGenerated) {
    test(data);
  }
});

Deno.test("binary", () => {
  for (const data of testDataBinary) {
    test(data);
  }
});

Deno.test("boolean", () => {
  for (const data of testDataBoolean) {
    test(data);
  }
});

Deno.test("large-generated", () => {
  for (const data of testDataLargeGenerated) {
    test(data);
  }
});

Deno.test("date", () => {
  for (const data of testDataDate) {
    test(data);
  }
});

Deno.test("display-string", () => {
  for (const data of testDisplayString) {
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
          const canonical = data.canonical.join(", ");
          assertEquals(encoded, canonical, data.name);
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
          const canonical = data.canonical.join(", ");
          assertEquals(encoded, canonical, data.name);
        }
      }
      break;
    case "dictionary":
      {
        let dict: Dictionary;
        try {
          dict = decodeDictionary(...data.raw);
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
        const actual = convertDictionary(dict);
        assertEquals(actual, data.expected, data.name);
        if (data.canonical) {
          const canonical = data.canonical.join(", ");
          const encoded = encodeDictionary(dict);
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
      if (item instanceof Token) {
        return {
          __type: "token",
          value: item.valueOf(),
        };
      }
      if (item instanceof Uint8Array) {
        return {
          __type: "binary",
          value: base32encode(item),
        };
      }
      if (item instanceof Date) {
        return {
          __type: "date",
          value: item.getTime() / 1000,
        };
      }
      if (item instanceof DisplayString) {
        return {
          __type: "displaystring",
          value: item.valueOf(),
        };
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

function convertDictionary(dict: Dictionary) {
  const result = [];
  for (const [key, value] of dict) {
    result.push([key, convertItemOrInnerList(value)]);
  }
  return result;
}

// base32encode is minimum implementation for encoding base32.
function base32encode(data: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let dst = "";
  let si = 0;
  const n = data.length - (data.length % 5);
  while (si < n) {
    const hi = data[si + 0] << 24 | data[si + 1] << 16 | data[si + 2] << 8 |
      data[si + 3];
    const lo = hi << 8 | data[si + 4];
    dst += alphabet[(hi >> 27) & 0x1F];
    dst += alphabet[(hi >> 22) & 0x1F];
    dst += alphabet[(hi >> 17) & 0x1F];
    dst += alphabet[(hi >> 12) & 0x1F];
    dst += alphabet[(hi >> 7) & 0x1F];
    dst += alphabet[(hi >> 2) & 0x1F];
    dst += alphabet[(lo >> 5) & 0x1F];
    dst += alphabet[lo & 0x1F];
    si += 5;
  }

  switch (data.length % 5) {
    case 4:
      {
        const hi = data[si + 0] << 24 | data[si + 1] << 16 | data[si + 2] << 8 |
          data[si + 3];
        const lo = hi << 8;
        dst += alphabet[(hi >> 27) & 0x1F];
        dst += alphabet[(hi >> 22) & 0x1F];
        dst += alphabet[(hi >> 17) & 0x1F];
        dst += alphabet[(hi >> 12) & 0x1F];
        dst += alphabet[(hi >> 7) & 0x1F];
        dst += alphabet[(hi >> 2) & 0x1F];
        dst += alphabet[(lo >> 5) & 0x1F];
        dst += "=";
      }
      break;
    case 3:
      {
        const hi = data[si + 0] << 24 | data[si + 1] << 16 | data[si + 2] << 8;
        dst += alphabet[(hi >> 27) & 0x1F];
        dst += alphabet[(hi >> 22) & 0x1F];
        dst += alphabet[(hi >> 17) & 0x1F];
        dst += alphabet[(hi >> 12) & 0x1F];
        dst += alphabet[(hi >> 7) & 0x1F];
        dst += "=";
        dst += "=";
        dst += "=";
      }
      break;
    case 2:
      {
        const hi = data[si + 0] << 24 | data[si + 1] << 16;
        dst += alphabet[(hi >> 27) & 0x1F];
        dst += alphabet[(hi >> 22) & 0x1F];
        dst += alphabet[(hi >> 17) & 0x1F];
        dst += alphabet[(hi >> 12) & 0x1F];
        dst += "=";
        dst += "=";
        dst += "=";
        dst += "=";
      }
      break;
    case 1:
      {
        const hi = data[si + 0] << 24;
        dst += alphabet[(hi >> 27) & 0x1F];
        dst += alphabet[(hi >> 22) & 0x1F];
        dst += "=";
        dst += "=";
        dst += "=";
        dst += "=";
        dst += "=";
        dst += "=";
      }
      break;
  }
  return dst;
}
