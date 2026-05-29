import { ChatOpenRouter } from "@langchain/openrouter";
import { createAgent, tool } from "langchain";
import { z } from "zod";
import { globTool } from "./tools/glob";
import { grepTool } from "./tools/grep";
import { editTool } from "./tools/edit";
import { writeTool } from "./tools/write";
import { taskTool } from "./tools/task";
import { todoTool } from "./tools/todo";

const openrouter = new ChatOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL,
});

const readFile = tool(
  async (input) => {
    try {
      const content = await Bun.file(input.filePath).text();
      return content;
    } catch (error: any) {
      return `Error reading file: ${error.message}`;
    }
  },
  {
    name: "readFile",
    description: "Reads the contents of a file at the given path",
    schema: z.object({ filePath: z.string() }),
  },
);

const writeFile = tool(
  async (input) => {
    try {
      await Bun.write(input.filePath, input.content);
      return `Successfully wrote to ${input.filePath}`;
    } catch (error: any) {
      return `Error writing file: ${error.message}`;
    }
  },
  {
    name: "writeFile",
    description: "Writes the given content to a file at the given path",
    schema: z.object({ filePath: z.string(), content: z.string() }),
  },
);

const bash = tool(
  async (input) => {
    try {
      const proc = Bun.spawn(["bash", "-c", input.command]);
      const textOutput = await new Response(proc.stdout).text();
      return textOutput || "Command executed successfully with no output.";
    } catch (error: any) {
      return `Error executing command: ${error.message}`;
    }
  },
  {
    name: "bash",
    description: "Executes a bash command and returns the standard output",
    schema: z.object({ command: z.string() }),
  },
);

const glob = tool(
  async (input) => {
    try {
      const files = await globTool(input.pattern, input.path);
      return JSON.stringify(files);
    } catch (error: any) {
      return `Error in glob: ${error.message}`;
    }
  },
  {
    name: "glob",
    description: "Fast file pattern matching tool that works with any codebase size. Supports glob patterns like '**/*.js' or 'src/**/*.ts'",
    schema: z.object({
      pattern: z.string(),
      path: z.string().optional()
    }),
  },
);

const grep = tool(
  async (input) => {
    try {
      const results = await grepTool(input.pattern, input.path, input.include);
      return JSON.stringify(results);
    } catch (error: any) {
      return `Error in grep: ${error.message}`;
    }
  },
  {
    name: "grep",
    description: "Fast content search tool that works with any codebase size. Searches file contents using regular expressions",
    schema: z.object({
      pattern: z.string(),
      path: z.string().optional(),
      include: z.string().optional()
    }),
  },
);

const edit = tool(
  async (input) => {
    try {
      const result = await editTool(input.filePath, input.oldString, input.newString, input.replaceAll ?? false);
      return result;
    } catch (error: any) {
      return `Error in edit: ${error.message}`;
    }
  },
  {
    name: "edit",
    description: "Performs exact string replacements in files. Must read file first before editing.",
    schema: z.object({
      filePath: z.string(),
      oldString: z.string(),
      newString: z.string(),
      replaceAll: z.boolean().optional()
    }),
  },
);

const write = tool(
  async (input) => {
    try {
      const result = await writeTool(input.filePath, input.content);
      return result;
    } catch (error: any) {
      return `Error in write: ${error.message}`;
    }
  },
  {
    name: "write",
    description: "Writes a file to the local filesystem. Will overwrite existing file.",
    schema: z.object({
      filePath: z.string(),
      content: z.string()
    }),
  },
);

const task = tool(
  async (input) => {
    try {
      const result = await taskTool(input.description, input.prompt, input.subagent_type, input.task_id);
      return JSON.stringify(result);
    } catch (error: any) {
      return `Error in task: ${error.message}`;
    }
  },
  {
    name: "task",
    description: "Launch a new agent to handle complex, multistep tasks autonomously. Available agent types: explore, general",
    schema: z.object({
      description: z.string(),
      prompt: z.string(),
      subagent_type: z.enum(["explore", "general"]),
      task_id: z.string().optional()
    }),
  },
);

const todo = tool(
  async (input) => {
    try {
      const result = await todoTool(input.operation, input.todos);
      return result;
    } catch (error: any) {
      return `Error in todo: ${error.message}`;
    }
  },
  {
    name: "todo",
    description: "Create and manage a structured task list for your current coding session. Operations: get, set, add, update, clear",
    schema: z.object({
      operation: z.string(),
      todos: z.array(z.object({
        content: z.string(),
        status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']),
        priority: z.enum(['high', 'medium', 'low'])
      })).optional()
    }),
  },
);

export const agent = createAgent({
  model: openrouter,
  tools: [readFile, writeFile, bash, glob, grep, edit, write, task, todo],
  systemPrompt:
    "You are Zest, a powerful CLI assistant. You have access to tools to read files, write files, run bash commands, glob for file matching, grep for content search, edit files, write files, launch subagents for complex tasks, and manage todo lists.",
});
