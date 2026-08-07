# Java JSON 基准测试报告

本基准测试使用相同的数据比较 fory-json、Jackson 和 Gson。String 组不包含 UTF-8
转换。UTF-8 字节组会在可用时使用直接字节数组 API。Gson 包含 String 到 UTF-8 的编码以及
UTF-8 到 String 的解码。

```bash
cd benchmarks/java
./run_json.sh --libs fory-json,jackson,gson
```

- 基准测试日期：`2026-07-28`
- 源代码提交：`bd0ca9825b3206b1a53bf27bfb180a551ab39236`
- 平台：Apple M4 Pro, macOS 15.7.2, arm64
- JDK：`26.0.1`
- VM：`OpenJDK 64-Bit Server VM`
- JMH：`1.37`
- 预热：3 次迭代 × `2 s`
- 测量：5 次迭代 × `2 s`
- Fork 数：1；线程数：1
- 模式：吞吐量；数值越高越好

## String

![Java JSON String 基准测试吞吐量](string_throughput.png)

## UTF-8 字节

![Java JSON UTF-8 字节基准测试吞吐量](utf8_bytes_throughput.png)

## 结果

| 表示形式   | 操作     | fory-json ops/sec | jackson ops/sec | gson ops/sec | 最快      |
| ---------- | -------- | ----------------: | --------------: | -----------: | --------- |
| String     | 序列化   |         7,387,465 |       2,049,368 |    1,084,042 | fory-json |
| String     | 反序列化 |         2,897,955 |       1,074,885 |      902,772 | fory-json |
| UTF-8 字节 | 序列化   |        10,375,498 |       1,868,614 |    1,037,211 | fory-json |
| UTF-8 字节 | 反序列化 |         3,077,158 |       1,268,397 |      933,079 | fory-json |
