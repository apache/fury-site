# Python 基准性能报告

_生成于 2026-05-08 17:54:45_

## 如何生成本报告

```bash
cd benchmarks/python
./run.sh
```

## 基准图表

图表展示吞吐量（ops/sec）；数值越高越好。

![Throughput](throughput.png)

## 硬件与操作系统信息

| 键                   | 值                        |
| --------------------- | ---------------------------- |
| 操作系统                    | Darwin 24.6.0                |
| 机器架构               | arm64                        |
| 处理器             | arm                          |
| Python                | 3.10.8                       |
| CPU 核心数（物理）  | 12                           |
| CPU 核心数（逻辑）   | 12                           |
| 总内存（GB）        | 48.0                         |
| Python 实现 | CPython                      |
| 基准平台    | macOS-15.7.2-arm64-arm-64bit |

## 基准配置

| 键        | 值 |
| ---------- | ----- |
| warmup     | 3     |
| iterations | 15    |
| repeat     | 5     |
| number     | 1000  |
| list_size  | 5     |

## 基准结果

### 延迟结果（纳秒）

| 数据类型          | 操作   | fory (ns) | protobuf (ns) | pickle (ns) | 最快 |
| ----------------- | ---- | --------- | ------------- | ---- | ------- |
| NumericStruct     | 序列化   | 491.4     | 802.3         | 1119.8      | fory    |
| NumericStruct     | 反序列化 | 522.2     | 1211.6        | 1788.7      | fory    |
| Sample            | 序列化   | 1096.4    | 3315.8        | 10185.2     | fory    |
| Sample            | 反序列化 | 2772.0    | 6659.7        | 7061.9      | fory    |
| MediaContent      | 序列化   | 989.2     | 3433.2        | 4392.7      | fory    |
| MediaContent      | 反序列化 | 1518.7    | 4381.2        | 4305.1      | fory    |
| NumericStructList | 序列化   | 1111.2    | 4707.9        | 3235.8      | fory    |
| NumericStructList | 反序列化 | 1891.7    | 6891.0        | 3974.9      | fory    |
| SampleList        | 序列化   | 3447.2    | 18719.1       | 32125.7     | fory    |
| SampleList        | 反序列化 | 13131.6   | 35264.2       | 24154.4     | fory    |
| MediaContentList  | 序列化   | 2996.5    | 17597.4       | 11087.8     | fory    |
| MediaContentList  | 反序列化 | 6228.7    | 21562.0       | 10459.3     | fory    |

### 吞吐结果（ops/sec）

| 数据类型          | 操作   | fory TPS  | protobuf TPS | pickle TPS | 最快 |
| ----------------- | ---- | --------- | ------------ | ---------- | ------- |
| NumericStruct     | 序列化   | 2,035,025 | 1,246,379    | 893,009    | fory    |
| NumericStruct     | 反序列化 | 1,915,112 | 825,344      | 559,055    | fory    |
| Sample            | 序列化   | 912,072   | 301,590      | 98,182     | fory    |
| Sample            | 反序列化 | 360,751   | 150,158      | 141,605    | fory    |
| MediaContent      | 序列化   | 1,010,939 | 291,275      | 227,652    | fory    |
| MediaContent      | 反序列化 | 658,462   | 228,247      | 232,281    | fory    |
| NumericStructList | 序列化   | 899,960   | 212,407      | 309,040    | fory    |
| NumericStructList | 反序列化 | 528,636   | 145,116      | 251,580    | fory    |
| SampleList        | 序列化   | 290,092   | 53,421       | 31,128     | fory    |
| SampleList        | 反序列化 | 76,152    | 28,357       | 41,400     | fory    |
| MediaContentList  | 序列化   | 333,720   | 56,826       | 90,189     | fory    |
| MediaContentList  | 反序列化 | 160,547   | 46,378       | 95,609     | fory    |

### 序列化数据大小（字节）

| 数据类型          | fory | protobuf | pickle |
| ----------------- | ---- | -------- | ------ |
| NumericStruct     | 78   | 93       | 169    |
| Sample            | 445  | 375      | 1176   |
| MediaContent      | 366  | 301      | 624    |
| NumericStructList | 219  | 475      | 582    |
| SampleList        | 1914 | 1890     | 3546   |
| MediaContentList  | 1614 | 1520     | 1415   |
