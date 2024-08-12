# @shogo82148/sfv

[![test](https://github.com/shogo82148/sfvjs/actions/workflows/test.yaml/badge.svg)](https://github.com/shogo82148/sfvjs/actions/workflows/test.yaml)
[![npm](https://img.shields.io/npm/v/@shogo82148/sfv)](https://www.npmjs.com/package/@shogo82148/sfv)
[![npm](https://img.shields.io/npm/dm/@shogo82148/sfv)](https://www.npmjs.com/package/@shogo82148/sfv)
[![JSR](https://jsr.io/badges/@shogo82148/sfv)](https://jsr.io/@shogo82148/sfv)

TypeScript implementation for
[RFC 8941 Structured Field Values for HTTP](https://www.rfc-editor.org/rfc/rfc8941.html).

## SYNOPSIS

### Decoding Structured Field Values

```typescript
import {
  Decimal,
  decodeDictionary,
  decodeItem,
  decodeList,
  DisplayString,
  Integer,
  Item,
  Token,
} from "@shogo82148/sfv";

// decoding Items
const item = decodeItem("abc");
const value = item.value;
if (value instanceof Integer) {
  // Integers
}
if (value instanceof Decimal) {
  // Decimals
}
if (typeof value === "string") {
  // Strings
}
if (value instanceof Token) {
  // Tokens
}
if (value instanceof Uint8Array) {
  // Binary Sequences
}
if (typeof value === "boolean") {
  // Booleans
}
if (value instanceof Date) {
  // Dates
}
if (value instanceof DisplayString) {
  // Display Strings
}

// decoding Lists
const list = decodeList("abc, efg");

// decoding dictionary
const dict = decodeDictionary("foo=bar, baz=qux");
```

### Encoding Structured Field Values

```typescript
import {
  Decimal,
  encodeItem,
  encodeList,
  Integer,
  Item,
  Token,
} from "@shogo82148/sfv";

// encoding Items
encodeItem(new Item(new Token("a"))); // a
encodeItem(new Item("a")); // "a"
encodeItem(new Item(new Integer(10))); // 10
encodeItem(new Item(new Decimal(3.14))); // 3.14
encodeItem(new Item(new Uint8Array([1, 2, 3]))); // :AQID:
encodeItem(new Item(true)); // ?1
encodeItem(new Item(new Date(0))); // @0
encodeItem(new Item(new DisplayString("a"))); // %"a"

// encoding Lists
encodeList([new Item(new Token("abc")), new Item(new Token("efg"))]); // abc, efg

// encoding Dictionary
const dict = new Dictionary();
dict.set("foo", new Item(new Token("bar")));
dict.set("baz", new Item(new Token("qux")));
encodeDictionary(dict); // foo=bar, baz=qux
```

## Supported Data Types

SFV types are mapped to TypeScript types as described in this section. Note that
only `List`, `Dictionary`, and `Item` can be in a top-level.

### Values of Items

The actual type might be one of them:

| Type of SFV   | Example of SFV     | Type in TypeScript | Example in TypeScript       |
| ------------- | ------------------ | ------------------ | --------------------------- |
| Integer       | `10`               | `Integer`          | `new Integer(10)`           |
| Decimal       | `3.14`             | `Decimal`          | `new Decimal(3.14)`         |
| String        | `"hello"`          | `string`           | `"hello"`                   |
| Token         | `x`                | `Token`            | `new Token("x")`            |
| Byte Seq      | `:AQID:`           | `Uint8Array`       | `new Uint8Array([1, 2, 3])` |
| Boolean       | `?1`               | `boolean`          | `true`                      |
| Date          | `@1659578233`      | `Date`             | `new Date(1659578233000)`   |
| DisplayString | `%"f%c3%bc%c3%bc"` | `DisplayString`    | `new DisplayString("füü")`  |
| Inner List    | `(1 2)`            | `InnerList`        | `new InnerList()`           |

### Parameters of Items

**Parameters** are ordered map of key-value pairs. They are decoded to
`Parameters`.

### Lists

**Lists** are decoded to `List`.

### Inner Lists

**Inner Lists** are decoded to `InnerList`.

### Dictionaries

**Dictionaries** are ordered maps of key-value pairs. They are decoded to
`Dictionary`.
