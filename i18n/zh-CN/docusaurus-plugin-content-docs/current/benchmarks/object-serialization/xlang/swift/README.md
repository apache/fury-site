# Fory Swift 基准测试

本基准测试比较 Apache Fory、Protocol Buffers 和 JSON 在 Swift 中的序列化与反序列化吞吐量。

## 基准测试范围

以下结果涵盖 `swift-benchmark` 运行的常规/xlang 测试用例。外部类型与载体对比使用独立的
`swift-external-benchmark` 可执行文件，仅在明确请求时才会包含。

## 吞吐量图

![吞吐量](throughput.png)

## 硬件和运行时信息

| 项目                   | 值                            |
| ---------------------- | ----------------------------- |
| 时间戳                 | 2026-08-04T09:52:12Z          |
| 操作系统               | Version 15.7.2 (Build 24G325) |
| 主机                   | MacBook-Pro.local             |
| CPU 核心数（逻辑）     | 12                            |
| 内存 (GB)              | 48.00                         |
| 每个测试用例的时长 (s) | 3                             |

## 吞吐量结果

| 数据类型          | 操作     |   Fory TPS | Protobuf TPS | JSON TPS | 最快         |
| ----------------- | -------- | ---------: | -----------: | -------: | ------------ |
| NumericStruct     | 序列化   | 14,759,606 |    7,572,190 |  481,278 | fory (1.95x) |
| NumericStruct     | 反序列化 | 18,155,795 |    7,317,942 |  377,802 | fory (2.48x) |
| Sample            | 序列化   |  5,633,231 |    1,380,130 |  102,372 | fory (4.08x) |
| Sample            | 反序列化 |  1,509,740 |      916,626 |   52,897 | fory (1.65x) |
| MediaContent      | 序列化   |  2,987,821 |      784,863 |  111,200 | fory (3.81x) |
| MediaContent      | 反序列化 |  1,072,345 |      549,726 |   97,799 | fory (1.95x) |
| NumericStructList | 序列化   |  5,515,769 |    1,093,924 |   93,635 | fory (5.04x) |
| NumericStructList | 反序列化 |  2,598,609 |      746,527 |   76,161 | fory (3.48x) |
| SampleList        | 序列化   |  1,201,868 |      220,772 |   20,772 | fory (5.44x) |
| SampleList        | 反序列化 |    286,949 |      161,192 |   10,777 | fory (1.78x) |
| MediaContentList  | 序列化   |    657,276 |      118,004 |   22,744 | fory (5.57x) |
| MediaContentList  | 反序列化 |    215,726 |       99,445 |   19,521 | fory (2.17x) |

## 序列化大小 (bytes)

| 数据类型          | Fory | Protobuf | JSON |
| ----------------- | ---: | -------: | ---: |
| NumericStruct     |   78 |       93 |  159 |
| Sample            |  445 |      375 |  696 |
| MediaContent      |  362 |      301 |  608 |
| NumericStructList |  255 |      475 |  816 |
| SampleList        | 1978 |     1890 | 3501 |
| MediaContentList  | 1531 |     1520 | 3067 |
