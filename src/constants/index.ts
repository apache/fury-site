export const COPY_SUCCESS_MSG = "Copied!";
export const COPY_FAIL_MSG = "Failed to copy!";
export const COPY_TIMEOUT = 2000;

export const CODE_STRING = `import java.util.List;
import java.util.Arrays;
import org.apache.fory.*;

public class Example {
  // Note that Fory instances should be reused between
  // multiple serializations of different objects.
  static ThreadSafeFury fory = Fory.builder().withLanguage(Language.JAVA)
    // Allow to deserialize objects unknown types,
    // more flexible but less secure.
    // .requireClassRegistration(false)
    .buildThreadSafeFury();

  static {
    // Registering types can reduce class name serialization
    // overhead but not mandatory.
    // If secure mode enabled
    //all custom types must be registered.
    fory.register(SomeClass.class);
  }

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
`;

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
