---
title: Go
sidebar_position: 6
id: go
license: |
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
---

## 输出布局

Go 输出路径取决于 Schema 选项和 `--go_out`。

对于 `addressbook.fdl`，配置 `go_package` 后，生成的输出遵循所配置的导入路径/包（例如位于 `--go_out` 根目录下）。

如果没有 `go_package`，输出使用请求的 `--go_out` 目录和从包派生的文件命名。

## 类型生成

嵌套类型默认使用下划线命名（`Person_PhoneType`、`Person_PhoneNumber`）：

```go
type Person_PhoneType int32

const (
    Person_PhoneTypeMobile Person_PhoneType = 0
    Person_PhoneTypeHome   Person_PhoneType = 1
    Person_PhoneTypeWork   Person_PhoneType = 2
)

type Person_PhoneNumber struct {
    Number    string           `fory:"id=1"`
    PhoneType Person_PhoneType `fory:"id=2"`
}
```

消息生成带 `fory` tag 和字节辅助方法的 struct：

```go
type Person struct {
    Name   string               `fory:"id=1"`
    Id     int32                `fory:"id=2"`
    Phones []Person_PhoneNumber `fory:"id=7,type=list"`
    Pet    Animal               `fory:"id=8"`
}

func (m *Person) ToBytes() ([]byte, error) { ... }
func (m *Person) FromBytes(data []byte) error { ... }
```

联合生成带构造函数、访问器和 visitor API 的类型化 case struct：

```go
type AnimalCase uint32

type Animal struct {
    case_ AnimalCase
    value any
}

func DogAnimal(v *Dog) Animal { ... }
func CatAnimal(v *Cat) Animal { ... }

func (u Animal) Case() AnimalCase { ... }
func (u Animal) AsDog() (*Dog, bool) { ... }
func (u Animal) Visit(visitor AnimalVisitor) error { ... }
```

## 注册

生成的注册函数：

```go
func RegisterTypes(f *fory.Fory) error {
    if err := f.RegisterUnion(Animal{}, 106, fory.NewUnionSerializer(...)); err != nil {
        return err
    }
    if err := f.RegisterEnum(Person_PhoneType(0), 101); err != nil {
        return err
    }
    if err := f.RegisterStruct(Person_PhoneNumber{}, 102); err != nil {
        return err
    }
    if err := f.RegisterStruct(Person{}, 100); err != nil {
        return err
    }
    return nil
}
```

对于没有显式 `[id=...]` 的 Schema，生成的注册代码使用计算得到的数字 ID：

```go
if err := f.RegisterEnum(Status(0), 1124725126); err != nil { ... }
if err := f.RegisterUnion(Wrapper{}, 1471345060, fory.NewUnionSerializer(...)); err != nil { ... }
if err := f.RegisterStruct(Envelope{}, 3022445236); err != nil { ... }
if err := f.RegisterUnion(Envelope_Detail{}, 1609214087, fory.NewUnionSerializer(...)); err != nil { ... }
if err := f.RegisterStruct(Envelope_Payload{}, 2862577837); err != nil { ... }
```

如果设置了 `option enable_auto_type_id = false;`：

```go
if err := f.RegisterStructByName(Config{}, "myapp.models.Config"); err != nil { ... }
if err := f.RegisterUnionByName(Holder{}, "myapp.models.Holder", fory.NewUnionSerializer(...)); err != nil { ... }
```

`go_nested_type_style` 控制嵌套类型命名：

```protobuf
option go_nested_type_style = "camelcase";
```

两者都设置时，CLI flag `--go_nested_type_style` 会覆盖此 Schema 选项。

## 使用方式

```go
person := &Person{
    Name: "Alice",
    Pet:  DogAnimal(&Dog{Name: "Rex"}),
}

data, err := person.ToBytes()
if err != nil {
    panic(err)
}
var restored Person
if err := restored.FromBytes(data); err != nil {
    panic(err)
}
```

## gRPC 服务配套代码

使用 `--grpc` 时，Go 生成 `<module>_grpc.go`，其中包含生成的 `CodecV2`、客户端和服务端接口、流类型、描述符及注册辅助方法。codec 配置和使用方式请参阅 [Go gRPC](../../grpc/go.md)。
