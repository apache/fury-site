# C# 基准性能报告

_生成于 2026-05-08 17:54:45_

## 如何生成本报告

```bash
cd benchmarks/csharp
dotnet run -c Release --project ./Fory.CSharpBenchmark.csproj -- --output build/benchmark_results.json
python3 benchmark_report.py --json-file build/benchmark_results.json --output-dir report
```

## 基准图表

图表展示吞吐量（ops/sec）；数值越高越好。

![Throughput](throughput.png)

## 硬件与操作系统信息

| 键                                | 值                                                                                                                        |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 操作系统                                 | Darwin 24.6.0 Darwin Kernel Version 24.6.0: Wed Oct 15 21:12:15 PDT 2025; root:xnu-11417.140.69.703.14~1/RELEASE_ARM64_T6041 |
| 操作系统 Architecture                    | Arm64                                                                                                                        |
| 机器架构                            | Arm64                                                                                                                        |
| 运行时版本                    | 8.0.24                                                                                                                       |
| 基准日期（UTC）               | 2026-05-08T08:17:48.7871870Z                                                                                                 |
| 预热秒数                     | 1                                                                                                                            |
| 持续秒数                   | 3                                                                                                                            |
| CPU 逻辑核心数（基准采集） | 12                                                                                                                           |
| CPU 核心数（物理）               | 12                                                                                                                           |
| CPU 核心数（逻辑）                | 12                                                                                                                           |
| 总内存（GB）                     | 48.0                                                                                                                         |

## 基准覆盖范围

| 键                 | 值                                                                  |
| ------------------- | ---------------------------------------------------------------------- |
| 输入 JSON 中的用例 | 36 / 36                                                                |
| 序列化器         | fory, msgpack, protobuf                                                |
| 数据类型           | struct, sample, mediacontent, structlist, samplelist, mediacontentlist |
| 操作          | serialize, deserialize                                                 |

## 基准结果

### 延迟结果（纳秒）

| 数据类型          | 操作   | fory (ns) | protobuf (ns) | msgpack (ns) | 最快 |
| ----------------- | ---- | --------- | ------------- | ------------ | ------- |
| NumericStruct     | 序列化   | 50.3      | 170.8         | 107.8        | fory    |
| NumericStruct     | 反序列化 | 82.4      | 252.0         | 143.4        | fory    |
| Sample            | 序列化   | 263.2     | 607.1         | 377.1        | fory    |
| Sample            | 反序列化 | 199.4     | 1191.7        | 785.6        | fory    |
| MediaContent      | 序列化   | 379.7     | 509.6         | 417.6        | fory    |
| MediaContent      | 反序列化 | 450.3     | 846.6         | 791.4        | fory    |
| NumericStructList | 序列化   | 183.7     | 641.8         | 447.8        | fory    |
| NumericStructList | 反序列化 | 288.3     | 974.3         | 702.1        | fory    |
| SampleList        | 序列化   | 1205.7    | 3559.1        | 1864.1       | fory    |
| SampleList        | 反序列化 | 895.1     | 5710.3        | 2757.4       | fory    |
| MediaContentList  | 序列化   | 1495.4    | 2473.6        | 1812.4       | fory    |
| MediaContentList  | 反序列化 | 1946.7    | 3789.3        | 3778.4       | fory    |

### 吞吐结果（ops/sec）

| 数据类型          | 操作   | fory TPS   | protobuf TPS | msgpack TPS | 最快 |
| ----------------- | ---- | ---------- | ------------ | ---- | ------- |
| NumericStruct     | 序列化   | 19,881,457 | 5,853,473    | 9,276,378   | fory    |
| NumericStruct     | 反序列化 | 12,137,374 | 3,968,585    | 6,973,504   | fory    |
| Sample            | 序列化   | 3,799,418  | 1,647,119    | 2,652,142   | fory    |
| Sample            | 反序列化 | 5,016,006  | 839,129      | 1,272,975   | fory    |
| MediaContent      | 序列化   | 2,633,704  | 1,962,428    | 2,394,549   | fory    |
| MediaContent      | 反序列化 | 2,220,537  | 1,181,222    | 1,263,568   | fory    |
| NumericStructList | 序列化   | 5,445,002  | 1,558,156    | 2,232,996   | fory    |
| NumericStructList | 反序列化 | 3,469,207  | 1,026,402    | 1,424,322   | fory    |
| SampleList        | 序列化   | 829,415    | 280,973      | 536,448     | fory    |
| SampleList        | 反序列化 | 1,117,133  | 175,122      | 362,663     | fory    |
| MediaContentList  | 序列化   | 668,732    | 404,272      | 551,755     | fory    |
| MediaContentList  | 反序列化 | 513,699    | 263,899      | 264,664     | fory    |

### 序列化数据大小（字节）

| 数据类型          | fory | protobuf | msgpack |
| ----------------- | ---- | -------- | ------- |
| NumericStruct     | 78   | 93       | 87      |
| Sample            | 445  | 460      | 562     |
| MediaContent      | 362  | 307      | 479     |
| NumericStructList | 255  | 475      | 444     |
| SampleList        | 1978 | 2315     | 2819    |
| MediaContentList  | 1531 | 1550     | 2404    |
