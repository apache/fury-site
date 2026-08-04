# C++ 基准测试性能报告

_生成时间：2026-06-12 16:14:04_

## 如何生成此报告

```bash
cd benchmarks/cpp/build
./fory_benchmark --benchmark_format=json --benchmark_out=benchmark_results.json
cd ..
python benchmark_report.py --json-file build/benchmark_results.json --output-dir report
```

## 基准测试图表

下图展示吞吐量（ops/sec）；数值越高越好。

![吞吐量](throughput.png)

## 硬件和操作系统信息

| 项目                   | 值                        |
| ---------------------- | ------------------------- |
| 操作系统               | Darwin 24.6.0             |
| 机器架构               | arm64                     |
| 处理器                 | arm                       |
| CPU 核心数（物理）     | 12                        |
| CPU 核心数（逻辑）     | 12                        |
| 内存总量（GB）         | 48.0                      |
| 基准测试日期           | 2026-06-12T16:13:27+08:00 |
| CPU 核心数（基准测试） | 12                        |

## 基准测试结果

### 耗时结果（nanoseconds）

| 数据类型          | 操作     | fory (ns) | protobuf (ns) | msgpack (ns) | 最快 |
| ----------------- | -------- | --------- | ------------- | ------------ | ---- |
| NumericStruct     | 序列化   | 25.7      | 48.2          | 85.4         | fory |
| NumericStruct     | 反序列化 | 25.1      | 31.8          | 887.2        | fory |
| Sample            | 序列化   | 60.6      | 96.4          | 361.6        | fory |
| Sample            | 反序列化 | 176.7     | 397.0         | 2031.6       | fory |
| MediaContent      | 序列化   | 113.5     | 471.0         | 290.4        | fory |
| MediaContent      | 反序列化 | 247.3     | 641.9         | 2015.4       | fory |
| NumericStructList | 序列化   | 83.3      | 372.9         | 446.9        | fory |
| NumericStructList | 反序列化 | 158.1     | 268.2         | 4342.4       | fory |
| SampleList        | 序列化   | 258.8     | 2829.7        | 2602.3       | fory |
| SampleList        | 反序列化 | 1001.7    | 2794.4        | 12220.7      | fory |
| MediaContentList  | 序列化   | 504.2     | 2589.8        | 1549.5       | fory |
| MediaContentList  | 反序列化 | 1258.6    | 3620.3        | 10263.4      | fory |

### 吞吐量结果（ops/sec）

| 数据类型          | 操作     | fory TPS   | protobuf TPS | msgpack TPS | 最快 |
| ----------------- | -------- | ---------- | ------------ | ----------- | ---- |
| NumericStruct     | 序列化   | 38,845,461 | 20,734,963   | 11,707,994  | fory |
| NumericStruct     | 反序列化 | 39,872,217 | 31,443,829   | 1,127,092   | fory |
| Sample            | 序列化   | 16,496,488 | 10,372,657   | 2,765,312   | fory |
| Sample            | 反序列化 | 5,660,852  | 2,518,926    | 492,232     | fory |
| MediaContent      | 序列化   | 8,808,084  | 2,122,926    | 3,443,519   | fory |
| MediaContent      | 反序列化 | 4,043,028  | 1,557,819    | 496,175     | fory |
| NumericStructList | 序列化   | 11,999,598 | 2,681,661    | 2,237,536   | fory |
| NumericStructList | 反序列化 | 6,323,730  | 3,728,133    | 230,285     | fory |
| SampleList        | 序列化   | 3,864,068  | 353,391      | 384,276     | fory |
| SampleList        | 反序列化 | 998,326    | 357,854      | 81,828      | fory |
| MediaContentList  | 序列化   | 1,983,502  | 386,135      | 645,372     | fory |
| MediaContentList  | 反序列化 | 794,544    | 276,221      | 97,434      | fory |

### 序列化数据大小（bytes）

| 数据类型          | fory | protobuf | msgpack |
| ----------------- | ---- | -------- | ------- |
| NumericStruct     | 78   | 93       | 87      |
| Sample            | 445  | 375      | 530     |
| MediaContent      | 362  | 301      | 480     |
| NumericStructList | 255  | 475      | 449     |
| SampleList        | 1978 | 1890     | 2664    |
| MediaContentList  | 1531 | 1520     | 2421    |
