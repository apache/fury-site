---
slug: fury_meta_string_37_5_percent_space_efficient_encoding_than_utf8
title: "Meta String：Fury 序列化中比 UTF-8 节省 37.5% 空间的字符串编码"
description: "Meta String 使用紧凑字符编码表示标识符和元数据，与 UTF-8 相比最多可节省 37.5% 的空间。"
authors: [chaokunyang]
tags: [fury]
---

## 背景

在 RPC/序列化系统中，我们经常需要在进程之间传输 **`namespace/path/filename/fieldName/packageName/moduleName/className/enumValue`** 这类字符串。

这些字符串大多是 ASCII。为了跨进程传输，通常会采用 UTF-8 编码。UTF-8 下每个字符通常占 1 个字节，这在空间利用率上并不理想。

如果进一步观察，会发现高频字符其实集中在**小写字母、`.`、`$`、`_`**，可表示在更小的数值区间 **`0~32`**。而 1 个字节可表示 `0~255`，大量高位比特被浪费，这个开销并不小。在动态序列化框架里，这类元信息（meta）相对真实业务数据会占据可观成本。

因此，我们在 Fury (现已经改名为 Fory) 中提出了新的字符串编码算法——**meta string encoding**。它把多数字符从 UTF-8 的 `8` bits 编码降为 `5` bits，可带来相对 UTF-8 **37.5% 的空间节省**。

## Meta String 简介

meta string 编码主要用于编码**字段名、namespace、packageName、className、path、filename** 等元字符串。

这类字符串的集合通常是可枚举且有限的，因此编码性能不是首要矛盾（编码结果可以缓存）。

meta string 对每个字符使用 `5/6` bits，而不是 UTF-8 的 `8` bits。由于位宽更低，相比 UTF-8 可实现**37.5% 空间节省**，编码后的二进制体积更小、存储占用更低、网络传输更快。

meta string 规范细节可参考：[Fury xlang serialization specification](https://fury.apache.org/docs/docs/specification/fury_xlang_serialization_spec/#meta-string)。

## 编码算法

字符串二进制编码算法：

| Algorithm                 | Pattern       | Description                                                                                                                                                                                                                                                                             |
| ------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LOWER_SPECIAL             | `a-z._$\|`    | 每个字符用 5 bits 写入，`a-z`: `0b00000~0b11001`，`._$\|`: `0b11010~0b11101`。在起始位额外写入 1 bit 标志，表示是否需要去掉最后一个字符（因为最后一个字节最多可能有 7 个冗余 bit，`1` 表示需要去掉最后一个字符）                                                         |
| LOWER_UPPER_DIGIT_SPECIAL | `a-zA-Z0~9._` | 每个字符用 6 bits 写入，`a-z`: `0b00000~0b11001`，`A-Z`: `0b11010~0b110011`，`0~9`: `0b110100~0b111101`，`._`: `0b111110~0b111111`。同样在起始位额外写入 1 bit 标志，表示是否需要去掉最后一个字符（因为最后一个字节最多可能有 7 个冗余 bit，`1` 表示需要去掉最后一个字符） |
| UTF-8                     | any chars     | UTF-8 编码                                                                                                                                                                                                                                                                              |

如果采用 `LOWER_SPECIAL/LOWER_UPPER_DIGIT_SPECIAL`，编码数据里必须携带 “strip last char” 标志。因为每个字符按 `5/6` bits 编码，最后一个字符后可能残留 `1~7` bits 未被使用，这些位可能导致多读出一个字符，需要在解码时去掉。

下面是 Java 编码代码片段，详见 [`org.apache.fury.meta.MetaStringEncoder#encodeGeneric(char[], int)`](https://github.com/apache/fury/blob/93800888595065b2690fec093ab0cbfd6ac7dedc/java/fury-core/src/main/java/org/apache/fury/meta/MetaStringEncoder.java#L235)：

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

private int charToValueLowerSpecial(char c) {
  if (c >= 'a' && c <= 'z') {
    return c - 'a';
  } else if (c == '.') {
    return 26;
  } else if (c == '_') {
    return 27;
  } else if (c == '$') {
    return 28;
  } else if (c == '|') {
    return 29;
  } else {
    throw new IllegalArgumentException("Unsupported character for LOWER_SPECIAL encoding: " + c);
  }
}

private int charToValueLowerUpperDigitSpecial(char c) {
  if (c >= 'a' && c <= 'z') {
    return c - 'a';
  } else if (c >= 'A' && c <= 'Z') {
    return 26 + (c - 'A');
  } else if (c >= '0' && c <= '9') {
    return 52 + (c - '0');
  } else if (c == specialChar1) {
    return 62;
  } else if (c == specialChar2) {
    return 63;
  } else {
    throw new IllegalArgumentException(
        "Unsupported character for LOWER_UPPER_DIGIT_SPECIAL encoding: " + c);
  }
}
```

下面是 Golang 解码代码片段，详见 [`go/fury/meta/meta_string_decoder.go:70`](https://github.com/apache/fury/blob/93800888595065b2690fec093ab0cbfd6ac7dedc/go/fury/meta/meta_string_decoder.go#L70)：

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

## 选择最优编码

对于绝大多数小写字符，meta string 会用 `5` bits 编码每个字符。

当字符串包含大写字符时，meta string 会先尝试插入标记把字符串转为小写表示，然后把该结果与 `6` bits 编码的字节数做比较，选择编码后体积更小的方案。

常见编码选择策略如下：

| Encoding Flag             | Pattern                                                  | Encoding Algorithm                                                                                                                                            |
| ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LOWER_SPECIAL             | every char is in `a-z._\|`                               | `LOWER_SPECIAL`                                                                                                                                               |
| FIRST_TO_LOWER_SPECIAL    | every char is in `a-z._` except first char is upper case | 把首字母大写字符转为小写后，使用 `LOWER_SPECIAL`                                                                                                                |
| ALL_TO_LOWER_SPECIAL      | every char is in `a-zA-Z._`                              | 把每个大写字符替换为 `\|` + `lower case`，再使用 `LOWER_SPECIAL`；若编码结果比 `LOWER_UPPER_DIGIT_SPECIAL` 更小，则选该方案                                   |
| LOWER_UPPER_DIGIT_SPECIAL | every char is in `a-zA-Z._`                              | 若编码结果比 `FIRST_TO_LOWER_SPECIAL` 更小，则使用 `LOWER_UPPER_DIGIT_SPECIAL`                                                                                |
| UTF8                      | any utf-8 char                                           | 使用 `UTF-8` 编码                                                                                                                                              |
| Compression               | any utf-8 char                                           | 无损压缩                                                                                                                                                      |

对于 package name、module name、namespace，通常会用 `LOWER_SPECIAL`。`ALL_TO_LOWER_SPECIAL` 也可用，因为它在不增加位宽的前提下可表示与 `LOWER_SPECIAL` 相同的字符，同时还能支持大写字母。

对于 className，通常会用 `FIRST_TO_LOWER_SPECIAL`。如果包含多个大写字符，则使用 `ALL_TO_LOWER_SPECIAL`；若字符串含数字，则会使用 `LOWER_UPPER_DIGIT_SPECIAL`。

最后，若字符串包含 `a-z0-9A-Z` 范围外字符，则回退到 UTF-8。

## 联合编码 Encoding Flags 与 Data

- 可以根据场景把 `flags + data` 联合编码：例如用首字节 3 bits 存 flags，其余字节存数据。这样做在某些情况下很有价值，因为末字节常有空洞位，把 flags 放进去不一定会增加序列化字节数。
- 也可以在 header 中统一编码这些 flags 以及 encoded size 等其他元信息，Fury 采用的是这种做法，参考：https://github.com/apache/fury/pull/1556

## 基准测试

对于字符串 `org.apache.fury.benchmark.data`，UTF-8 编码需要 `30` bytes，Fury meta string 仅需 `19` bytes。
对于字符串 `MediaContent`，UTF-8 编码需要 `12` bytes，Fury meta string 仅需 `9` bytes。

```java
// utf8 use 30 bytes, we use only 19 bytes
assertEquals(encoder.encode("org.apache.fury.benchmark.data").getBytes().length, 19);
// utf8 uses 12 bytes, we use only 9 bytes.
assertEquals(encoder.encode("MediaContent").getBytes().length, 9);
```
