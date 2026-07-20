# Fory Dart 基准

该基准比较 Apache Fory、Protocol Buffers 和 JSON 在 Dart 中的序列化与反序列化吞吐量。

## 吞吐图表

![Throughput](throughput.png)

## 硬件与运行时信息

| 键                   | 值                                                             |
| --------------------- | ----------------------------------------------------------------- |
| 时间戳             | 2026-05-08T08:23:10.201764Z                                       |
| 操作系统                    | Version 15.7.2 (Build 24G325)                                     |
| 主机                  | MacBook-Pro.local                                                 |
| CPU 核心数（逻辑）   | 12                                                                |
| 内存（GB）           | 48.00                                                             |
| Dart                  | 3.10.7 (stable) (Tue Dec 23 00:01:57 2025 -0800) on "macos_arm64" |
| 每个用例采样次数      | 5                                                                 |
| 每个用例预热时长（秒）   | 1.0                                                               |
| 每个用例持续时长（秒） | 1.5                                                               |

## 吞吐结果

| 数据类型          | 操作   |  Fory TPS | Protobuf TPS |  JSON TPS | 最快       |
| ----------------- | ---- | --------: | -----------: | --------: | ------------- |
| NumericStruct     | 序列化   | 9,007,809 |    1,582,003 |   774,574 | fory (5.69x)  |
| NumericStruct     | 反序列化 | 9,039,403 |    3,343,459 | 1,391,036 | fory (2.70x)  |
| Sample            | 序列化   | 2,434,800 |      538,385 |   133,800 | fory (4.52x)  |
| Sample            | 反序列化 | 2,362,665 |      909,410 |   239,924 | fory (2.60x)  |
| MediaContent      | 序列化   | 1,167,225 |      423,564 |   223,387 | fory (2.76x)  |
| MediaContent      | 反序列化 | 1,987,141 |      770,107 |   254,156 | fory (2.58x)  |
| NumericStructList | 序列化   | 2,551,102 |      283,827 |   139,615 | fory (8.99x)  |
| NumericStructList | 反序列化 | 3,028,068 |      530,360 |   265,058 | fory (5.71x)  |
| SampleList        | 序列化   |   568,937 |       47,426 |    25,386 | fory (12.00x) |
| SampleList        | 反序列化 |   542,871 |      108,349 |    48,058 | fory (5.01x)  |
| MediaContentList  | 序列化   |   226,507 |       81,828 |    41,780 | fory (2.77x)  |
| MediaContentList  | 反序列化 |   458,667 |      139,395 |    50,183 | fory (3.29x)  |

## 序列化大小（字节）

| 数据类型          | Fory | Protobuf | JSON |
| ----------------- | ---: | -------: | ---: |
| NumericStruct     |   78 |       93 |  159 |
| Sample            |  445 |      377 |  791 |
| MediaContent      |  362 |      307 |  619 |
| NumericStructList |  255 |      475 |  816 |
| SampleList        | 1978 |     1900 | 3976 |
| MediaContentList  | 1531 |     1550 | 3122 |
