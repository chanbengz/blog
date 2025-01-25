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

## Preface

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

![Compiler Stucture](compiler-structure.png)

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

Beform learning the regular expressions, we have to know what it operates on.

String has the following terminologies, which we refer to when we describe the string:
- **Alphabet**: The set of symbols that might appear in the string. It's not the English alphabet.
- **String**: A sequence of symbols from the alphabet. The special symbol $\epsilon$ denotes an empty string.
- **Prefix/Suffix**: The beginning/end of a string.
- **Proper Prefix/Suffix**: A prefix/suffix that is not the string itself and not the empty string.
- **Substring**: A string that is not the string itself and not the empty string.
- **Proper Substring**: A substring that is not the string itself and not the empty string.
- **Subsequence**: A string that is obtained by deleting some symbols from the string. Doesn't have to be continuous.

As you see, sub- means to slice the string, and so we also need to combine the strings, which is called **concatenation**
- **Concatenation**: The concatenation of two strings $s_1$ and $s_2$ is denoted by $s_1s_2$.
- **Exponentiation**: Multiple concatenation of the same string, denoted by $s^n$. $s^0 = \epsilon$, $s^1 = s$, $s^i = s^{i-1}s$.

Elements in the alphabet are constructed together to form a string, and so all the possible strings form the set we call **language**.
Language is a set, so it surely has the operations of set:
| Operation | Definition and Notation | Example |
| --- | --- | --- |
| Union | $L_1 \cup L_2 = \{s | s \in L_1 \text{ or } s \in L_2\}$ | Digits $\cup$ Letters = $\{0, 1, 2, \ldots, 9, a, b, c, \ldots, z\}$ |
| Concatenation | $L_1L_2 = \{s_1s_2 | s_1 \in L_1 \text{ and } s_2 \in L_2\}$ | DigitsLetters = $\{0a, 0b, 0c, \ldots, 9z\}$ |
| Kleene Closure | $L^* = \cup_{i=0}^{\infty} L^i$ | $L^* = $ the set of all strings over the alphabet including the empty string |
| Positive Closure | $L^+ = \cup_{i=1}^{\infty} L^i$ | Excluding the empty string |

Regular expressions describe the pattern of the strings by constructing the language, set of all strings that match the pattern. Suppose
we have the alphabet $\Sigma$ and denote the language by $L(a)$, where $a \in \Sigma$. Then the regular expressions are defined as follows:
- Basis of regular express: $\epsilon$ and $a \in \Sigma$ are regular expressions.
- Induction: If $r$ and $s$ are regular expressions, then so are:
  - $r | s$ union denoting $L(r) \cup L(s)$
  - $rs$ concatenation, denoting $L(r)L(s)$
  - $r^*$ Kleene closure denoting $(L(r))^*$
  - $(r_1)$ grouping the language $L(r) = r$.

Language as a set makes regexp operations with algebraic properties, like identity, associative and communicative,
but we won't go into details here. Since we construct the language from basis and induction, the definitions like building 
materials from atoms, are called **Regular Definitions**, in forms like
$$
  d_1 \rightarrow r_1
$$
...
$$
  d_n \rightarrow r_n
$$
where $d_i$ is the name of the definition and $r_i$ is the regular expression. For example, when we describe the 
regexp of IPv4 address, we can define the regular definitions like

```regexp
digit -> 0|1|2|3|4|5|6|7|8|9 # 0 or 1 or 2 or ... or 9
term -> ((1|2)digit^2)|((1|2|3|4|5|6|7|8|9)digit)|(digit^1) # 0-9, 10-99, 100-299
ipv4 -> term.term.term.term # 0-299.0-299.0-299.0-299 incorrect, need more tuning
```

### Finite Automata

As learnt in Digital Logic, finite automata has alphabet $\Sigma$, states $S$ and transitions $T$ between states. Special states
are start and accept states. "Finite" means that the number of states is finite, and different transitions form two kinds of automata:
- **Non-deterministic Finite Automata (NFA)**: Multiple transitions when reading the same symbol and possible $\epsilon$ transitions.
- **Deterministic Finite Automata (DFA)**: Only one transition on each symbol and no $\epsilon$ transitions.

![](nfa-example.png)

NFAs are easy to construct but hard to implement, because we don't know where we head to when we have multiple transitions. So we 
need DFA as a deterministic version of NFA (you probably know DFA is a subset of NFA).

![](dfa-example.png)

All we need for DFA is to keep executing until out of input

```c
int DFA(int start_state, int accept_states[], int transition[][]) {
    int state = start_state;
    int input;

    while (input = readChar() != EOF) {
        state = transition[state][input];
    }

    for (int i = 0; i < sizeof(accept_states) / sizeof(int); i++) {
        if (state == accept_states[i]) {
            return 1; // Accept
        }
    }
    return 0; // Reject
}
```

### Thompson's Construction

The first step to implement the regexp is to convert it to NFA using Thompson's Construction. The construction is intuitive
and similar to the regexp itself. For the basic rules,

![](basis-rules-thompson.png)

And for the induction rules,

![](inductive-rules-thompson1.png)

![](inductive-rules-thompson2.png)

![](inductive-rules-thompson3.png)

When implementing the lexer, we also need to combine the NFAs for every token to a single one, and distinguish the tokens by
their accept states.

![](combining-nfas.png)

### Subset Construction Algorithm

As said before, DFA must be the implementation of lexer, so we must convert the NFA to DFA then. Intuitively, 
$\epsilon$ transitions, as the first problem, can be solved by combining the states that can be reached by them,
because the states are reached without consuming any input -- they are the same state. So the set of those states
as subset of NFA states, form a new state in DFA. That's where the name "Subset Construction" comes from. Note that
the subset might have intersection, so every unique subset denotes a new state in DFA and same subset denotes the same state.

The second problem is the multiple transitions on the same symbol. Because we have combined the states, we can also
combine the states that can be reached by the same symbol and from the states in the subset, to also form a new state in DFA.

The combination of the states is called $\epsilon$-closure. When constructing $\epsilon$-closure(T) on the initial set T,
we keep adding the states that can be reached by $\epsilon$ transitions from the states in T until no more states can be added.
Yeah it's similar to the BFS, $\epsilon$-closure should also be called $\epsilon$-reachability.

$T$ is the new state in DFA, and then we construct the transitions from $T$ to other states in DFA, called move($T$, a) = $T^\prime$.
where $T^\prime$ is the set of states that can be reached by symbol $a$ from the states in $T$. And finally we extend $T^\prime$ to its
$\epsilon$-closure to form the new state in DFA.

```c++
int* epsilonClosure(int states[], vector<int> epsilonTransitions[]) {
    vector<int> closure;
    stack<int> stk;
    for (int s: states) {
        closure.push_back(s);
        stk.push(s);
    }

    while (!stk.empty()) {
        int state = stk.top();
        stk.pop();
        for (int next: epsilonTransitions[state]) {
            if (find(closure.begin(), closure.end(), next) == closure.end()) {
                closure.push_back(next);
                stk.push(next);
            }
        }
    }

    return closure.data();
}

int* move(int states[], vector<int> transitions[], int symbol) {
    vector<int> next;
    for (int s: states) {
        for (int t: transitions[s]) {
            if (t == symbol) {
                next.push_back(s);
                break;
            }
        }
    }
    return next.data();
}

void constructDFA(int start_state, int accept_states[], int states[], vector<int> transitions[], char alphabet[]) {
    vector<int> epsilonTransitions[]; // Construct epsilon transitions
    for (int i = 0; i < sizeof(transitions) / sizeof(vector<int>); i++) {
        for (int j = 0; j < transitions[i].size(); j++) {
            if (transitions[i][j] == epsilon) {
                epsilonTransitions[i].push_back(j);
            }
        }
    }

    vector<int> start = epsilonClosure({start_state}, epsilonTransitions);
    vector<int> accept;
    vector<vector<int>> transition_dfa[alphabet.size()];
    vector<vector<int>> dfa;
    stack<vector<int>> stk;

    // Construct DFA states and transitions
    stk.push(start);
    while (!stk.empty()) {
        vector<int> T = stk.top();
        stk.pop();
        dfa.push_back(T); // Add DFA state
        for (int a: alphabet) {
            vector<int> U = epsilonClosure(move(T, transitions, a), epsilonTransitions);
            transition_dfa[T][a].push_back(U); // Add DFA transition
            if (find(dfa.begin(), dfa.end(), U) == dfa.end()) {
                stk.push(U);
            }
        }
    }

    // Closures containing the accept states of NFA are accept states of DFA.
    for (int i = 0; i < dfa.size(); i++) {
        for (int j = 0; j < sizeof(accept_states) / sizeof(int); j++) {
            if (find(dfa[i].begin(), dfa[i].end(), accept_states[j]) != dfa[i].end()) {
                accept.push_back(i);
                break;
            }
        }
    }
}
```

Above is the pseudocode of the Subset Construction Algorithm.

Sometimes we can optimize the DFA by merging the states that have the same moves on all symbols.

## Syntax Analysis

After the lexical analysis, we have the tokens, but we don't know how to combine them to form a valid program. That's where
the syntax analysis comes in. Syntax analysis checks if the tokens are in the right order, and generates a tree-like structure
called the Abstract Syntax Tree (AST).

Parsers are stronger versions of lexers, and thus we use it to recognize a more complex structure of the source code.
And similar to the lexing part, where regular definitions give NFA and then DFA, we also have the context-free grammar
to describe the syntax of the programming language. CFGs then are transformed into parsers, another kind of automata.

### Parsers

We have three kinds of parsers:
- **Universal parsers**: Some methods (e.g., Earley’s algorithm1) can parse any grammar but they are hard to implement.
- **Top-down parsers**: Start from the root of the production rules and derive to the leaves. Recursive Descent is a common
  method for top-down parsing and LL(1) is its table-driven version.
- **Bottom-up parsers**: Start from the leaves and deduce to the root. LR(1) is a common method for bottom-up parsing.

Industrially, recursive-descent parsers are called parser combinators and they are mostly used for their flexibility, while
table-driven parsers are referred to as parser generators because they generate tables from production rules.

### Context-Free Grammars


### Top-Down Parsing


### Bottom-Up Parsing


## Semantic Analysis


### Syntax-Directed Definitions


### Syntax-Directed Translation


## Intermediate Representation

## Runtime Environment

## Code Generation

## Data Flow Analysis

## Epilogue

I myself always get surprised by the abstraction of compilers and the well-designed of them. The theories, unlike those in
other CS courses, are intuitive and practical. Learning compilers is not only learning the theories, but also learning the
software engineering. It's a great course and I hope you enjoy it as much as I do. Happy hacking!
