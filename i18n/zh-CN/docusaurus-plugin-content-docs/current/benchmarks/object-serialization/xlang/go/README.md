# Go 序列化基准测试报告

生成时间：2026-08-07 12:14:23

## 性能图表

![吞吐量](throughput.png)

## 系统信息

- **操作系统**：Darwin 24.6.0
- **架构**：arm64
- **Python**：3.10.8

## 性能摘要

| 数据类型          | 操作     | Fory (ops/s) | Protobuf (ops/s) | Msgpack (ops/s) | Fory 对比 PB | Fory 对比 MP |
| ----------------- | -------- | ------------ | ---------------- | --------------- | ------------ | ------------ |
| NumericStruct     | 序列化   | 18.49M       | 7.63M            | 3.78M           | 2.42x        | 4.90x        |
| NumericStruct     | 反序列化 | 13.57M       | 8.55M            | 1.99M           | 1.59x        | 6.82x        |
| Sample            | 序列化   | 8.2M         | 2.72M            | 683.53K         | 3.01x        | 12.00x       |
| Sample            | 反序列化 | 3.91M        | 2.25M            | 372.3K          | 1.74x        | 10.50x       |
| MediaContent      | 序列化   | 3.89M        | 2.07M            | 1.22M           | 1.87x        | 3.19x        |
| MediaContent      | 反序列化 | 2.35M        | 1.77M            | 704.23K         | 1.32x        | 3.33x        |
| NumericStructList | 序列化   | 1.5M         | 412.88K          | 212.81K         | 3.64x        | 7.06x        |
| NumericStructList | 反序列化 | 1.18M        | 396.83K          | 104.62K         | 2.98x        | 11.29x       |
| SampleList        | 序列化   | 484.73K      | 145.75K          | 38.43K          | 3.33x        | 12.61x       |
| SampleList        | 反序列化 | 225.89K      | 103.72K          | 18.56K          | 2.18x        | 12.17x       |
| MediaContentList  | 序列化   | 243.43K      | 110.25K          | 68.82K          | 2.21x        | 3.54x        |
| MediaContentList  | 反序列化 | 132.59K      | 86.84K           | 35.41K          | 1.53x        | 3.74x        |

## 详细耗时（ns/op）

| 数据类型          | 操作     | Fory   | Protobuf | Msgpack |
| ----------------- | -------- | ------ | -------- | ------- |
| NumericStruct     | 序列化   | 54.1   | 131.1    | 264.9   |
| NumericStruct     | 反序列化 | 73.7   | 117.0    | 502.2   |
| Sample            | 序列化   | 121.9  | 367.4    | 1463.0  |
| Sample            | 反序列化 | 255.8  | 444.6    | 2686.0  |
| MediaContent      | 序列化   | 257.4  | 482.0    | 820.0   |
| MediaContent      | 反序列化 | 426.3  | 564.3    | 1420.0  |
| NumericStructList | 序列化   | 665.8  | 2422.0   | 4699.0  |
| NumericStructList | 反序列化 | 846.8  | 2520.0   | 9558.0  |
| SampleList        | 序列化   | 2063.0 | 6861.0   | 26023.0 |
| SampleList        | 反序列化 | 4427.0 | 9641.0   | 53893.0 |
| MediaContentList  | 序列化   | 4108.0 | 9070.0   | 14530.0 |
| MediaContentList  | 反序列化 | 7542.0 | 11515.0  | 28241.0 |

### 序列化数据大小（字节）

| 数据类型          | Fory | Protobuf | Msgpack |
| ----------------- | ---- | -------- | ------- |
| NumericStruct     | 78   | 93       | 88      |
| Sample            | 445  | 375      | 524     |
| MediaContent      | 362  | 301      | 400     |
| NumericStructList | 855  | 1900     | 1766    |
| SampleList        | 7663 | 7560     | 10486   |
| MediaContentList  | 5851 | 6080     | 8006    |
