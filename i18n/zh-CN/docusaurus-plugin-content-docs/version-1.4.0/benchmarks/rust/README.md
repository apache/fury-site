# Rust 基准性能报告

_生成于 2026-05-08 17:55:12_

## 如何生成本报告

```bash
cd benchmarks/rust
cargo bench --bench serialization_bench 2>&1 | tee results/cargo_bench.log
cargo run --release --bin fory_profiler -- --print-all-serialized-sizes | tee results/serialized_sizes.txt
python benchmark_report.py --log-file results/cargo_bench.log --size-file results/serialized_sizes.txt --output-dir results
```

## 基准图表

图表展示吞吐量（ops/sec）；数值越高越好。

![Throughput](throughput.png)

## 硬件与操作系统信息

| 键                  | 值               |
| -------------------- | ------------------- |
| 操作系统                   | Darwin 24.6.0       |
| 机器架构              | arm64               |
| 处理器            | arm                 |
| CPU 核心数（物理） | 12                  |
| CPU 核心数（逻辑）  | 12                  |
| 总内存（GB）       | 48.0                |
| 基准日期       | 2026-05-08T16:47:49 |

## 基准结果

### 延迟结果（纳秒）

| 数据类型          | 操作   | fory (ns) | protobuf (ns) | msgpack (ns) | 最快 |
| ----------------- | ---- | --------- | ------------- | ------------ | ------- |
| NumericStruct     | 序列化   | 38.1      | 94.6          | 239.5        | fory    |
| NumericStruct     | 反序列化 | 32.6      | 62.4          | 107.3        | fory    |
| Sample            | 序列化   | 95.3      | 591.8         | 601.1        | fory    |
| Sample            | 反序列化 | 410.1     | 925.8         | 805.9        | fory    |
| MediaContent      | 序列化   | 120.0     | 553.9         | 446.9        | fory    |
| MediaContent      | 反序列化 | 566.7     | 713.0         | 902.6        | fory    |
| NumericStructList | 序列化   | 121.5     | 512.0         | 618.0        | fory    |
| NumericStructList | 反序列化 | 137.9     | 404.9         | 615.9        | fory    |
| SampleList        | 序列化   | 267.7     | 2920.2        | 2011.1       | fory    |
| SampleList        | 反序列化 | 1831.9    | 4636.4        | 4141.4       | fory    |
| MediaContentList  | 序列化   | 367.1     | 2835.6        | 1441.7       | fory    |
| MediaContentList  | 反序列化 | 2703.8    | 3622.3        | 4832.3       | fory    |

### 吞吐结果（ops/sec）

| 数据类型          | 操作   | fory TPS   | protobuf TPS | msgpack TPS | 最快 |
| ----------------- | ---- | ---------- | ------------ | ---- | ------- |
| NumericStruct     | 序列化   | 26,237,767 | 10,572,613   | 4,174,668   | fory    |
| NumericStruct     | 反序列化 | 30,720,079 | 16,035,920   | 9,322,271   | fory    |
| Sample            | 序列化   | 10,494,611 | 1,689,874    | 1,663,700   | fory    |
| Sample            | 反序列化 | 2,438,311  | 1,080,170    | 1,240,895   | fory    |
| MediaContent      | 序列化   | 8,331,945  | 1,805,445    | 2,237,687   | fory    |
| MediaContent      | 反序列化 | 1,764,633  | 1,402,426    | 1,107,960   | fory    |
| NumericStructList | 序列化   | 8,232,485  | 1,953,125    | 1,618,071   | fory    |
| NumericStructList | 反序列化 | 7,250,580  | 2,469,563    | 1,623,535   | fory    |
| SampleList        | 序列化   | 3,735,664  | 342,442      | 497,240     | fory    |
| SampleList        | 反序列化 | 545,881    | 215,685      | 241,464     | fory    |
| MediaContentList  | 序列化   | 2,724,350  | 352,659      | 693,626     | fory    |
| MediaContentList  | 反序列化 | 369,850    | 276,068      | 206,941     | fory    |

### 序列化数据大小（字节）

| 数据类型          | fory | protobuf | msgpack |
| ----------------- | ---- | -------- | ------- |
| NumericStruct     | 78   | 93       | 87      |
| Sample            | 445  | 375      | 590     |
| MediaContent      | 362  | 301      | 500     |
| NumericStructList | 255  | 475      | 449     |
| SampleList        | 1978 | 1890     | 2964    |
| MediaContentList  | 1531 | 1520     | 2521    |
