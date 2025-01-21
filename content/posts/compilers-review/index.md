+++
title = 'CS323 Compilers Final Review'
date = 2025-01-19T19:54:59+08:00
summary = "Compilers are fun!"
math = true
draft = false
categories = ["Compilers", "System"]
tags = ["Review"]
+++

> Thanks a lot for the note from IskXCr and [GuTao's](https://site-fan.github.io/posts/cs323_notes/).
> Pictures are from Prof. Liu's slides. Thanks much for the great course.

So a couple of weeks after the final exam, I decided to write a review of the course for its elegance. 
This note will try to be not only a review note, but also a crash course for compilers.

And besides the theoretical things, the lab part, where you learn how to do lexing and parsing and IRs, 
is also important. But it's not covered in this note.

## Introduction to Compilers

Ever since Alan Turing first proposed his concept of a universal machine in 1936, computer scientists
have been trying to figure out how to actually build one, and here comes the computer in binary form.
In Computer Organization, we learned how to build a CPU from scratch and write assembly code, but it
sucks to write assembly code by hand.

Our ancestors have been through this pain, from poking the holes in the paper tape, to writing assembly
and finally to writing high-level languages, C/C++ and Python. BUT how did they come to this? While
assembly is only a mnemonic for the binaries, high-level languages provide a more idiomatic way to write
programs, and compilers are the bridge between them.

Why we are still studying compilers, even if we won't research on them? Compilers, despite being a 
language translator, are also a icon of system software. It's a textbook example of software engineering.
If you want to develop a large project, you should probably learn from the compiler, like how it's designed,
modularized, blah blah blah.

### Phases of Compilers

Bilge aside. So how are compilers pieced together? A compiler is usually divided into several phases:

![Compiler Stucture](compiler-strcutre.png)

- **Frontend**: Compiler analyzes the source code we wrote at the first look, and generates its own
    form of the code, which is called the Intermediate Representation (IR).
  - **Lexical Analysis**: Breaks the source code into tokens. Souce code is a string of characters, so
    we need to break it into words, like `int`, `main`, `return`, etc. It's called tokens.
  - **Syntax Analysis**: The tokens must come in a certain order, which is called the syntax. Syntax
    analysis checks if the tokens are in the right order. Otherwise, compiler cannot find the meaning.
    Compiler generates a tree-like structure called the Abstract Syntax Tree (AST).
  - **Semantic Analysis**: Compiler checks the context of the tokens. For example, you cannot refer to a
    variable before you declare it. Also, since syntax analysis ignores the context, numerous checks are 
    done here.
  - **IR Generation**: After the source code is checked, compiler generates its own form of the code, 
    which is called the Intermediate Representation (IR), from the AST. IR is a form of code that is
    easier to optimize and generate the final code.
- **Backend**:
  - **Machine-Independent Optimization**: Compiler optimizes the IR, like folding constants, removing
    dead code, etc, to make the code run faster. It's only based on the IR, not the target machine.
  - **Code Generation**: Finally, compiler generates the machine code from the optimized IR
  - **Machine-Dependent Optimization**: Compiler optimizes the binaries based on the target machine, like
    x86 and ARM has different feature instructions like SIMD, so the optimization is different.

> Check what's the input and output of each phase, and what's the purpose of each phase.

### Compiler versus Interpreter

Compiler and interpreter are both language translators, but they are different in the way they work.

![](comp_vs_inte.png)

Compiler tries to translate the whole program into machine code at once, and then run it. It's faster.

Interpreter translates the program on runtime, which is slower, but it's easier to debug and run.

Also in terms of optimization, compiler can do more optimization, because it can see the whole program.

## Lexical Analysis

Now comes the first phase of compilers, lexical analysis. The goal of lexical analysis is to break the
source code into tokens. For example, the source code `int main() { return 0; }` should be broken into
`int`, `main`, `(`, `)`, `{`, `return`, `0`, `;`, `}`. These words and characters are primarily the 
**lexemes**, which need further conversion into **tokens**.

![](role-of-lexer.png)

Firstly, we should define what the tokens look like and how they facilitate the syntax analysis. Tokens
are defined by us, so we can represent them by `enum` and in theory, we denote them with `token name`.
Some of them might have attributes, like the value of an integer, or the name of a variable, so we need
to add an optional attribute to the token. Thus, we have formally defined format of tokens: `<token name, attribute>`.

![](example-lexer.png)

And we can use a symbol table to store the attributes of the tokens since there might be duplicated attributes.

However, we don't know how to formally define the actual form of tokens, which means that the **pattern** of
tokens must be specified. Usually it's accomplished by regular expressions, or in some advanced lexers, you
can write your own codes to define the pattern.

If none of the patterns match, the lexer will throw an error, which is called a **lexical error**.

### Regular Expressions

A regular expression has the following terminologies:
- **Alphabet**: The set of symbols that might appear in the string. It's not the English alphabet.
- **String**: A sequence of symbols from the alphabet. The special symbol $\epsilon$ denotes an empty string.
- **Prefix/Suffix**: The beginning/end of a string.
- **Proper Prefix/Suffix**: A prefix/suffix that is not the string itself and not the empty string.
- **Substring**: A string that is not the string itself and not the empty string.
- **Proper Substring**: A substring that is not the string itself and not the empty string.
- **Subsequence**: A string that is obtained by deleting some symbols from the string. Doesn't have to be continuous.



### Finite Automata

