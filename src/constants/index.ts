export const COPY_SUCCESS_MSG = "Copied!";
export const COPY_FAIL_MSG = "Failed to copy!";
export const COPY_TIMEOUT = 2000;

export const CODE_EXAMPLES = {
  java: {
    label: "Java",
    code: `import java.util.List;
import java.util.Arrays;
import org.apache.fory.*;

public class Example {
  // Note that Fory instances should be reused between
  // multiple serializations of different objects.
  static ThreadSafeFory fory = Fory.builder().withLanguage(Language.JAVA)
    // Allow to deserialize objects unknown types,
    // more flexible but less secure.
    // .requireClassRegistration(false)
    .buildThreadSafeFory();

  static {
    // Registering types can reduce class name serialization
    // overhead but not mandatory.
    // If secure mode enabled
    // all custom types must be registered.
    fory.register(SomeClass.class);
  }

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}`,
  },
  kotlin: {
    label: "Kotlin",
    code: `import org.apache.fory.Fory
import org.apache.fory.ThreadSafeFory
import org.apache.fory.serializer.kotlin.KotlinSerializers

data class Person(val name: String, val id: Long, val github: String)
data class Point(val x : Int, val y : Int, val z : Int)

fun main(args: Array<String>) {
    // Note: following fory init code should be executed only once in a global scope instead
    // of initializing it everytime when serialization.
    val fory: ThreadSafeFory = Fory.builder().requireClassRegistration(true).buildThreadSafeFory()
    KotlinSerializers.registerSerializers(fory)
    fory.register(Person::class.java)
    fory.register(Point::class.java)

    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
}`,

  },
  scala: {
    label: "Scala",
    code: `case class Person(name: String, id: Long, github: String)
case class Point(x : Int, y : Int, z : Int)

object ScalaExample {
  val fory: Fory = Fory.builder().withScalaOptimizationEnabled(true).build()
  // Register optimized fory serializers for scala
  ScalaSerializers.registerSerializers(fory)
  fory.register(classOf[Person])
  fory.register(classOf[Point])

  def main(args: Array[String]): Unit = {
    val p = Person("Shawn Yang", 1, "https://github.com/chaokunyang")
    println(fory.deserialize(fory.serialize(p)))
    println(fory.deserialize(fory.serialize(Point(1, 2, 3))))
  }
}`,

  },
  rust: {
    label: "Rust",
    code: `use fory::{Fory, Error};
use fory::ForyObject;

#[derive(ForyObject, Debug, PartialEq)]
struct User {
	name: String,
	age: i32,
	email: String,
}

fn main() -> Result<(), Error> {
	let mut fory = Fory::default();
	fory.register::<User>(1)?;

	let user = User { name: "Alice".into(), age: 30, email: "alice@example.com".into() };
	let bytes = fory.serialize(&user)?;
	let decoded: User = fory.deserialize(&bytes)?;
	assert_eq!(user, decoded);
	Ok(())
}`,

  },

  python: {
    label: "Python",
    code: `import pyfory
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class Person:
    name: str
    age: int
    scores: List[int]
    metadata: Dict[str, str]

# Python mode - supports all Python types including dataclasses
fory = pyfory.Fory(xlang=False, ref=True)
fory.register(Person)
person = Person("Bob", 25, [88, 92, 85], {"team": "engineering"})
data = fory.serialize(person)
result = fory.deserialize(data)
print(result)  # Person(name='Bob', age=25, ...)`,
  },

};

export const imageUrls = [
  { key: "java", src: "/home/java.svg", label: "Java" },
  { key: "python", src: "/home/python.svg", label: "Python" },
  { key: "golang", src: "/home/golang.svg", label: "Golang" },
  {
    key: "javascript",
    src: "/home/JavaScript.svg",
    label: "JavaScript",
  },
  { key: "rust", src: "/home/Rust.svg", label: "Rust" },
  { key: "more", src: "/home/more.svg", label: "More" },
];
