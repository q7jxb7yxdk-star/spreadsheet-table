import { parseCellReference } from "./references";

export type TokenType = "number" | "string" | "reference" | "identifier" | "operator" | "paren" | "comma" | "colon" | "eof";

export interface Token {
  type: TokenType;
  value: string;
}

export interface NumberNode {
  type: "number";
  value: number;
}

export interface ReferenceNode {
  type: "reference";
  value: string;
}

export interface StringNode {
  type: "string";
  value: string;
}

export interface RangeNode {
  type: "range";
  from: ReferenceNode;
  to: ReferenceNode;
}

export interface ColumnRangeNode {
  type: "columnRange";
  from: string;
  to: string;
}

export interface BinaryNode {
  type: "binary";
  operator: "+" | "-" | "*" | "/";
  left: AstNode;
  right: AstNode;
}

export interface FunctionNode {
  type: "function";
  name: string;
  args: AstNode[];
}

export type AstNode = NumberNode | StringNode | ReferenceNode | RangeNode | ColumnRangeNode | BinaryNode | FunctionNode;

export function parseFormulaExpression(source: string): AstNode {
  const parser = new FormulaParser(tokenize(source.startsWith("=") ? source.slice(1) : source));
  return parser.parse();
}

export function normalizeFormulaText(source: string): string {
  const formulaStart = source.search(/\S/);
  if (formulaStart < 0 || source[formulaStart] !== "=") return source;

  let result = source.slice(0, formulaStart + 1);
  let index = formulaStart + 1;

  while (index < source.length) {
    const char = source[index];

    if (char === '"' || char === "'") {
      const quoted = readQuotedString(source, index);
      result += quoted.value;
      index = quoted.end;
      continue;
    }

    const rest = source.slice(index);
    const reference = /^[A-Za-z]+[1-9][0-9]*/.exec(rest);
    if (reference) {
      result += reference[0].toUpperCase();
      index += reference[0].length;
      continue;
    }

    const identifier = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (identifier) {
      const value = identifier[0];
      result += shouldUppercaseIdentifier(source, index + value.length, result) ? value.toUpperCase() : value;
      index += value.length;
      continue;
    }

    result += char;
    index++;
  }

  return result;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source[index];
    if (/\s/.test(char)) {
      index++;
      continue;
    }

    if (/[+\-*/]/.test(char)) {
      tokens.push({ type: "operator", value: char });
      index++;
      continue;
    }

    if (/[()]/.test(char)) {
      tokens.push({ type: "paren", value: char });
      index++;
      continue;
    }

    if (char === ",") {
      tokens.push({ type: "comma", value: char });
      index++;
      continue;
    }

    if (char === ":") {
      tokens.push({ type: "colon", value: char });
      index++;
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      let value = "";
      index++;
      while (index < source.length && source[index] !== quote) {
        value += source[index];
        index++;
      }
      if (source[index] !== quote) throw new Error("Unterminated string");
      index++;
      tokens.push({ type: "string", value });
      continue;
    }

    const rest = source.slice(index);
    const reference = /^[A-Za-z]+[1-9][0-9]*/.exec(rest);
    if (reference && parseCellReference(reference[0])) {
      tokens.push({ type: "reference", value: reference[0] });
      index += reference[0].length;
      continue;
    }

    const number = /^[-+]?[0-9]+(?:\.[0-9]+)?/.exec(rest);
    if (number) {
      tokens.push({ type: "number", value: number[0] });
      index += number[0].length;
      continue;
    }

    const identifier = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest);
    if (identifier) {
      tokens.push({ type: "identifier", value: identifier[0] });
      index += identifier[0].length;
      continue;
    }

    throw new Error(`Unexpected token near ${rest}`);
  }

  tokens.push({ type: "eof", value: "" });
  return tokens;
}

function readQuotedString(source: string, start: number): { value: string; end: number } {
  const quote = source[start];
  let index = start + 1;
  while (index < source.length) {
    if (source[index] === "\\") {
      index += 2;
      continue;
    }
    if (source[index] === quote) {
      index++;
      break;
    }
    index++;
  }
  return { value: source.slice(start, index), end: index };
}

function shouldUppercaseIdentifier(source: string, nextIndex: number, currentResult: string): boolean {
  const next = nextNonWhitespace(source, nextIndex);
  if (next === "(" || next === ":") return true;
  return previousNonWhitespace(currentResult) === ":";
}

function nextNonWhitespace(source: string, start: number): string | null {
  for (let index = start; index < source.length; index++) {
    if (!/\s/.test(source[index])) return source[index];
  }
  return null;
}

function previousNonWhitespace(source: string): string | null {
  for (let index = source.length - 1; index >= 0; index--) {
    if (!/\s/.test(source[index])) return source[index];
  }
  return null;
}

class FormulaParser {
  private index = 0;

  constructor(private readonly tokens: Token[]) {}

  parse(): AstNode {
    const node = this.parseAdditive();
    this.expect("eof");
    return node;
  }

  private parseAdditive(): AstNode {
    let node = this.parseMultiplicative();
    while (this.peek().type === "operator" && ["+", "-"].includes(this.peek().value)) {
      const operator = this.advance().value as "+" | "-";
      node = { type: "binary", operator, left: node, right: this.parseMultiplicative() };
    }
    return node;
  }

  private parseMultiplicative(): AstNode {
    let node = this.parsePrimary();
    while (this.peek().type === "operator" && ["*", "/"].includes(this.peek().value)) {
      const operator = this.advance().value as "*" | "/";
      node = { type: "binary", operator, left: node, right: this.parsePrimary() };
    }
    return node;
  }

  private parsePrimary(): AstNode {
    const token = this.peek();

    if (token.type === "number") {
      this.advance();
      return { type: "number", value: Number(token.value) };
    }

    if (token.type === "string") {
      this.advance();
      return { type: "string", value: token.value };
    }

    if (token.type === "reference") {
      const from: ReferenceNode = { type: "reference", value: this.advance().value };
      if (this.peek().type === "colon") {
        this.advance();
        const toToken = this.expect("reference");
        return { type: "range", from, to: { type: "reference", value: toToken.value } };
      }
      return from;
    }

    if (token.type === "identifier") {
      const name = this.advance().value;
      if (this.peek().type === "colon") {
        this.advance();
        const to = this.expect("identifier").value;
        return { type: "columnRange", from: name, to };
      }

      this.expect("paren", "(");
      const args: AstNode[] = [];
      if (!(this.peek().type === "paren" && this.peek().value === ")")) {
        let parsingArguments = true;
        while (parsingArguments) {
          args.push(this.parseAdditive());
          if (this.peek().type !== "comma") {
            parsingArguments = false;
            continue;
          }
          this.advance();
        }
      }
      this.expect("paren", ")");
      return { type: "function", name, args };
    }

    if (token.type === "paren" && token.value === "(") {
      this.advance();
      const node = this.parseAdditive();
      this.expect("paren", ")");
      return node;
    }

    throw new Error(`Unexpected ${token.type}`);
  }

  private peek(): Token {
    return this.tokens[this.index];
  }

  private advance(): Token {
    return this.tokens[this.index++];
  }

  private expect(type: TokenType, value?: string): Token {
    const token = this.advance();
    if (token.type !== type || (value !== undefined && token.value !== value)) {
      throw new Error(`Expected ${value ?? type}`);
    }
    return token;
  }
}
