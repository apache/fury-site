---
slug: fury
title: 'Meta String: A 37.5% space efficient string encoding than UTF-8 in Fury serialization'
authors: [chaokunyang]
tags: [fury]
---

## Background

In rpc/serialization systems, we often need to send **`namespace/path/filename/fieldName/packageName/moduleName/className/enumValue`** between processes.

Those strings are mostly ascii strings. In order to transfer between processes, we often encode such strings using utf-8 encodings. Such encoding
will take one byte for every char, which seems already space efficient compared to utf-16.

But if we take a deeper look at into this, we will found that most chars are **lower chars plus `.`, `$` and `_`**, which can be expressed in a much 
smaller range **`0~32`**, and one byte can represent range `0~255`, the significant bits are wasted. And the cost is not ignorable, in a dynamic serialization
framework, such meta will take considerable cost compared to real data.

So we proposed a new string encoding algorithm which we called `meta string` encoding. It will encode most chars using less bits instead of `8` bits in utf-8 encoding.

## Meta String Introduction

Meta string encoding algorithm is mainly used to encode meta strings such as **field names, namespace, packageName, className, path and filename**.
Such a string is enumerated and limited, so the encoding performance is not important since we can cache the encoding result.

Meta string encoding uses `5/6` bits instead of `8` bits in utf-8 encoding for every chars. Since it uses less bits than utf8, it can bring 
**37.5% space cost savings** compared to utf-8 and has a smaller encoded binary size, which uses less storage and makes the network transfer faster.


## Encoding Algorithms

String binary encoding algorithm:

| Algorithm                 | Pattern       | Description                                                                                                                                                                                                                                                                              |
|---------------------------|---------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LOWER_SPECIAL             | `a-z._$\|`    | every char is written using 5 bits, `a-z`: `0b00000~0b11001`, `._$\|`: `0b11010~0b11101`, prepend one bit at the start to indicate whether strip last char since last byte may have 7 redundant bits(1 indicates strip last char)                                                        |
| LOWER_UPPER_DIGIT_SPECIAL | `a-zA-Z0~9._` | every char is written using 6 bits, `a-z`: `0b00000~0b11001`, `A-Z`: `0b11010~0b110011`, `0~9`: `0b110100~0b111101`, `._`: `0b111110~0b111111`,  prepend one bit at the start to indicate whether strip last char since last byte may have 7 redundant bits(1 indicates strip last char) |
| UTF-8                     | any chars     | UTF-8 encoding                                                                                                                                                                                                                                                                           |
If we use `LOWER_SPECIAL/LOWER_UPPER_DIGIT_SPECIAL`, we must add a strip last char flag in encoded data. This is because every char will be encoded using `5/6` bits, and the last char may have `1~7` bits which are unused by encoding, such bits may cause an extra char read, which we must strip off.

Encoding code snippet in java, see [`org.apache.fury.meta.MetaStringEncoder#encodeGeneric(char[], int)`](https://github.com/apache/incubator-fury/blob/93800888595065b2690fec093ab0cbfd6ac7dedc/java/fury-core/src/main/java/org/apache/fury/meta/MetaStringEncoder.java#L235) for more detailed:
```java
private byte[] encodeGeneric(char[] chars, int bitsPerChar) {
  int totalBits = chars.length * bitsPerChar + 1;
  int byteLength = (totalBits + 7) / 8; // Calculate number of needed bytes
  byte[] bytes = new byte[byteLength];
  int currentBit = 1;
  for (char c : chars) {
    int value =
        (bitsPerChar == 5) ? charToValueLowerSpecial(c) : charToValueLowerUpperDigitSpecial(c);
    // Encode the value in bitsPerChar bits
    for (int i = bitsPerChar - 1; i >= 0; i--) {
      if ((value & (1 << i)) != 0) {
        // Set the bit in the byte array
        int bytePos = currentBit / 8;
        int bitPos = currentBit % 8;
        bytes[bytePos] |= (byte) (1 << (7 - bitPos));
      }
      currentBit++;
    }
  }
  boolean stripLastChar = bytes.length * 8 >= totalBits + bitsPerChar;
  if (stripLastChar) {
    bytes[0] = (byte) (bytes[0] | 0x80);
  }
  return bytes;
}
```

Decoding code snippet in golang, see [`go/fury/meta/meta_string_decoder.go:70`](https://github.com/apache/incubator-fury/blob/93800888595065b2690fec093ab0cbfd6ac7dedc/go/fury/meta/meta_string_decoder.go#L70) for more details:
```go
func (d *Decoder) decodeGeneric(data []byte, algorithm Encoding) ([]byte, error) {
	bitsPerChar := 5
	if algorithm == LOWER_UPPER_DIGIT_SPECIAL {
		bitsPerChar = 6
	}
	// Retrieve 5 bits every iteration from data, convert them to characters, and save them to chars
	// "abc" encodedBytes as [00000] [000,01] [00010] [0, corresponding to three bytes, which are 0, 68, 0
	// Take the highest digit first, then the lower, in order

	// here access data[0] before entering the loop, so we had to deal with empty data in Decode method
	// totChars * bitsPerChar <= totBits < (totChars + 1) * bitsPerChar
	stripLastChar := (data[0] & 0x80) >> 7
	totBits := len(data)*8 - 1 - int(stripLastChar)*bitsPerChar
	totChars := totBits / bitsPerChar
	chars := make([]byte, totChars)
	bitPos, bitCount := 6, 1 // first highest bit indicates whether strip last char
	for i := 0; i < totChars; i++ {
		var val byte = 0
		for i := 0; i < bitsPerChar; i++ {
			if data[bitCount/8]&(1<<bitPos) > 0 {
				val |= 1 << (bitsPerChar - i - 1)
			}
			bitPos = (bitPos - 1 + 8) % 8
			bitCount++
		}
		ch, err := d.decodeChar(val, algorithm)
		if err != nil {
			return nil, err
		}
		chars[i] = ch
	}
	return chars, nil
}
```

## Select Best Encoding

For most lower chars, meta string will use `5` bits to encode every char. For string containing upper chars, meta string will try to convert the string into a
lower representation by inserting some markers, and compare used bytes with `6` bits encoding, then select the encoding which has smaller encoded size.

Here is the common encoding selection strategy:

| Encoding Flag             | Pattern                                                  | Encoding Algorithm                                                                                                                                          |
|---------------------------|----------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| LOWER_SPECIAL             | every char is in `a-z._\|`                               | `LOWER_SPECIAL`                                                                                                                                             |
| FIRST_TO_LOWER_SPECIAL    | every char is in `a-z._` except first char is upper case | replace first upper case char to lower case, then use `LOWER_SPECIAL`                                                                                       |
| ALL_TO_LOWER_SPECIAL      | every char is in `a-zA-Z._`                              | replace every upper case char by `\|` + `lower case`, then use `LOWER_SPECIAL`, use this encoding if it's smaller than Encoding `LOWER_UPPER_DIGIT_SPECIAL` |
| LOWER_UPPER_DIGIT_SPECIAL | every char is in `a-zA-Z._`                              | use `LOWER_UPPER_DIGIT_SPECIAL` encoding if it's smaller than Encoding `FIRST_TO_LOWER_SPECIAL`                                                             |
| UTF8                      | any utf-8 char                                           | use `UTF-8` encoding                                                                                                                                        |
| Compression               | any utf-8 char                                           | lossless compression                                                                                                                                        |

For package name, module name or namespace, `LOWER_SPECIAL` will be used mostly. `ALL_TO_LOWER_SPECIAL` can be used too since it can represent the same chars as `LOWER_SPECIAL` without using more bits, but also support string with uppercase chars.

For className, `FIRST_TO_LOWER_SPECIAL` will be used mostly. If there are multiple uppercase chars, then `ALL_TO_LOWER_SPECIAL` will be used instead.
If a string contains digits, then `LOWER_UPPER_DIGIT_SPECIAL` will be used.

Finally, utf8 will be the fallback encoding if the string contains some chars not in range `a-z0-9A-Z`.


## Encoding Flags and Data jointly

- Depending on the case, one can choose encoding `flags + data` jointly, using 3 bits of first byte for flags and other bytes for data.
- Or one can use a header to encode such flags with other meta such as encoded size, this is what Fury does in https://github.com/apache/incubator-fury/pull/1556 

## Benchmark
utf8 encoding uses `30` bytes for string `org.apache.fury.benchmark.data`, fury meta string uses only `19` bytes.
utf8 encoding uses `12` bytes for string `MediaContent`, but fury meta string uses only `9` bytes.

```java
// utf8 use 30 bytes, we use only 19 bytes
assertEquals(encoder.encode("org.apache.fury.benchmark.data").getBytes().length, 19);
// utf8 uses 12 bytes, we use only 9 bytes.
assertEquals(encoder.encode("MediaContent").getBytes().length, 9);
```
