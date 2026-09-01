"use strict";(self.webpackChunkfory_site=self.webpackChunkfory_site||[]).push([["85329"],{46071(e,r,a){a.d(r,{H2:()=>s,IU:()=>i,Sj:()=>t,gh:()=>o});let t="Copied!",s="Failed to copy!",i={java:{label:"Java",code:`import java.util.List;
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
    //all custom types must be registered.
    fory.register(SomeClass.class);
  }

  public static void main(String[] args) {
    SomeClass object = new SomeClass();
    byte[] bytes = fory.serialize(object);
    System.out.println(fory.deserialize(bytes));
  }
}`},kotlin:{label:"Kotlin",code:`import org.apache.fory.Fory
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
}`},scala:{label:"Scala",code:`case class Person(name: String, id: Long, github: String)
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
}`},rust:{label:"Rust",code:`use fory::{Fory, Error};
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
}`},python:{label:"Python",code:`import pyfory
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
print(result)  # Person(name='Bob', age=25, ...)`}},o=[{key:"java",src:"/home/java.svg",label:"Java"},{key:"python",src:"/home/python.svg",label:"Python"},{key:"golang",src:"/home/golang.svg",label:"Golang"},{key:"javascript",src:"/home/JavaScript.svg",label:"JavaScript"},{key:"rust",src:"/home/Rust.svg",label:"Rust"},{key:"more",src:"/home/more.svg",label:"More"}]},46460(e,r,a){a.r(r),a.d(r,{default:()=>y});var t=a(74848),s=a(96540),i=a(66497),o=a(45040),l=a(40142),n=a(49548),c=a(52756),d=a(46071);function y(){let[e,r]=(0,s.useState)("java"),[a,y]=(0,s.useState)(""),g=(0,i.Ay)("/home/programming.svg"),u=(0,s.useRef)(null),m=Object.keys(d.IU);(0,s.useEffect)(()=>(f(),()=>p()),[]);let f=()=>{p(),u.current=setInterval(()=>{r(e=>{let r=m.indexOf(e);return m[(r+1)%m.length]})},6e3)},p=()=>{u.current&&clearInterval(u.current)};return(0,t.jsxs)("div",{className:"flex flex-col md:flex-row items-center justify-center md:m-32 m-6 space-y-6 md:space-y-0 md:space-x-8",children:[(0,t.jsx)("div",{className:"hidden md:flex w-full md:w-1/2 justify-center",children:(0,t.jsx)("img",{src:g,alt:"programming-coding",className:"w-full max-w-md h-auto"})}),(0,t.jsxs)("div",{className:"relative text-sm overflow-hidden bg-[#1e1e2f]rounded-lg",style:{width:"100%",maxWidth:"600px",height:"666px"},children:[(0,t.jsx)("div",{className:"flex items-center px-3 py-2 bg-[#1e1e2f]",children:(0,t.jsx)("div",{className:"space-x-3 overflow-auto",children:m.map(a=>(0,t.jsx)("button",{onClick:()=>{r(a),f()},className:`px-3 py-1 rounded-full text-sm font-medium border border-gray-500 duration-200 ${e===a?"bg-blue-600 text-white":"bg-gray-600 text-gray-300 hover:bg-gray-500"}`,children:d.IU[a].label},a))})}),(0,t.jsx)(n.N,{mode:"wait",children:(0,t.jsxs)(c.P.div,{initial:{opacity:0,x:50},animate:{opacity:1,x:0},exit:{opacity:0,x:-50},transition:{duration:.4},className:"relative w-full h-full",children:[(0,t.jsx)("button",{onClick:()=>{navigator.clipboard.writeText(d.IU[e].code).then(()=>{y(d.Sj||"Copied!"),setTimeout(()=>y(""),2e3)}).catch(()=>{y(d.H2||"Copy failed")})},className:"absolute top-5 right-5 z-10 text-xs px-2 py-1 rounded border border-gray-500 text-white hover:bg-white/10 transition",children:a||"Copy"}),(0,t.jsx)("div",{className:"w-full h-full overflow-auto px-4 py-2",children:(0,t.jsx)(o.A,{language:e,style:l.A,wrapLongLines:!0,codeTagProps:{className:"text-sm bg-transparent"},children:d.IU[e].code})})]},e)})]})]})}}}]);