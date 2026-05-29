import { agent } from "./ai";
import { spawn } from "bun";

// Thinking animation states
const thinkingStates = ["", ".", "..", "..."];
let thinkingIndex = 0;
let thinkingInterval: number | null = null;

// Chat history
const HISTORY_FILE = ".zest_chat_history.json";
let chatHistory: Array<{role: string; content: string}> = [];

// Special commands
const SPECIAL_COMMANDS = {
  help: "/help",
  feedback: "/feedback",
  setup: "/setup",
  exit: ["exit", "quit"]
};

/**
 * Load chat history from file
 */
function loadChatHistory() {
  try {
    // Check if file exists first
    const exists = Bun.file(HISTORY_FILE).exists();
    if (!exists) {
      chatHistory = [];
      return;
    }

    const historyContent = Bun.file(HISTORY_FILE).text();
    const parsed = JSON.parse(historyContent);
    if (Array.isArray(parsed)) {
      chatHistory = parsed;
    } else {
      chatHistory = [];
    }
  } catch (error) {
    // If file doesn't exist or is invalid, start with empty history
    chatHistory = [];
  }
}

/**
 * Display thinking animation
 */
function startThinkingAnimation() {
  clearInterval(thinkingInterval);
  thinkingIndex = 0;

  thinkingInterval = setInterval(() => {
    process.stdout.write(`\rThinking${thinkingStates[thinkingIndex]}`);
    thinkingIndex = (thinkingIndex + 1) % thinkingStates.length;
  }, 500);
}

/**
 * Stop thinking animation
 */
function stopThinkingAnimation() {
  if (thinkingInterval !== null) {
    clearInterval(thinkingInterval);
    thinkingInterval = null;
    // Clear the line
    process.stdout.write("\r" + " ".repeat(20) + "\r");
  }
}

/**
 * Format text with markdown-like styling
 */
function formatMarkdownLike(text: string): string {
  // Handle code blocks
  let formatted = text.replace(
    /```(\w*)\n([\s\S]*?)\n```/g,
    (match, lang, code) => {
      // Simple syntax highlighting simulation
      const lines = code.split("\n");
      const highlightedLines = lines.map(line => {
        // Basic keyword highlighting for common languages
        if (lang === "js" || lang === "typescript" || lang === "ts") {
          return line
            .replace(/\b(function|const|let|var|class|extends|import|export|from|return|if|else|for|while|try|catch|async|await)\b/g,
                   `\x1b[33m$1\x1b[0m`); // Yellow for keywords
        }
        return line;
      });
      return `\x1b[36m\`\`\`${lang}\n${highlightedLines.join("\n")}\n\`\`\`\x1b[0m`;
    }
  );

  // Handle inline code
  formatted = formatted.replace(
    /`([^`]+)`/g,
    (match, code) => `\x1b[36m${code}\x1b[0m`
  );

  // Handle bold
  formatted = formatted.replace(
    /\*\*([^*]+)\*\*/g,
    (match, bold) => `\x1b[1m${bold}\x1b[0m`
  );

  // Handle italic
  formatted = formatted.replace(
    /\*([^*]+)\*/g,
    (match, italic) => `\x1b[3m${italic}\x1b[0m`
  );

  // Handle headers
  formatted = formatted.replace(
    /^# (.+)$/gm,
    (match, header) => `\x1b[1;34m${header}\x1b[0m\n\x1b[34m${"=".repeat(header.length)}\x1b[0m`
  );

  formatted = formatted.replace(
    /^## (.+)$/gm,
    (match, header) => `\x1b[1;34m${header}\x1b[0m\n\x1b[34m${"-".repeat(header.length)}\x1b[0m`
  );

  // Handle lists
  formatted = formatted.replace(
    /^(-|\d+\.) (.+)$/gm,
    (match, marker, item) => `  \x1b[32m${marker}\x1b[0m ${item}`
  );

  return formatted;
}

/**
 * Load chat history from file
 */
function loadChatHistory() {
  try {
    // Check if file exists first
    const exists = Bun.file(HISTORY_FILE).exists();
    if (!exists) {
      chatHistory = [];
      return;
    }

    const historyContent = Bun.file(HISTORY_FILE).text();
    const parsed = JSON.parse(historyContent);
    if (Array.isArray(parsed)) {
      chatHistory = parsed;
    } else {
      chatHistory = [];
    }
  } catch (error) {
    // If file doesn't exist or is invalid, start with empty history
    chatHistory = [];
  }
}

/**
 * Save chat history to file
 */
function saveChatHistory() {
  try {
    Bun.write(HISTORY_FILE, JSON.stringify(chatHistory, null, 2));
  } catch (error) {
    console.error("Failed to save chat history:", error);
  }
}

/**
 * Add message to chat history
 */
function addToHistory(role: string, content: string) {
  chatHistory.push({ role, content });
  // Keep only last 50 messages to prevent history from growing too large
  if (chatHistory.length > 50) {
    chatHistory = chatHistory.slice(-50);
  }
  saveChatHistory();
}

/**
 * Display help message
 */
function showHelp() {
  console.log(`
\x1b[1mAvailable Commands:\x1b[0m
  \x1b[36m/help\x1b[0m    - Show this help message
  \x1b[36m/feedback\x1b[0m - Get link to provide feedback
  \x1b[36m/setup\x1b[0m   - Run setup wizard for API key and persistence
  \x1b[36mexit\x1b[0m/\x1b[36mquit\x1b[0m - Exit the application

\x1b[1mAvailable Tools:\x1b[0m
  \x1b[36mreadFile\x1b[0m    - Read file contents
  \x1b[36mwriteFile\x1b[0m   - Write content to file
  \x1b[36mbash\x1b[0m         - Execute bash commands
  \x1b[36mglob\x1b[0m        - File pattern matching
  \x1b[36mgrep\x1b[0m         - Content search with regex
  \x1b[36medit\x1b[0m         - Edit files (requires reading first)
  \x1b[36mtask\x1b[0m         - Launch subagents for complex tasks
  \x1b[36mtodo\x1b[0m         - Manage task lists
`);
}

/**
 * Show feedback instructions
 */
function showFeedback() {
  console.log(`
\x1b[1mTo give feedback, please report issues at:\x1b[0m
  \x1b[36mhttps://github.com/anomalyco/opencode/issues\x1b[0m
`);
}

/**
 * Run setup wizard
 */
async function runSetupWizard() {
  console.log("\n\x1b[1m--- Zest Setup ---\x1b[0m\n");

  // Check if .env exists
  let envExists = false;
  try {
    await Bun.file(".env").exists();
    envExists = true;
  } catch (error) {
    // File doesn't exist
  }

  if (envExists) {
    console.log(".env file already exists.");
    const overwrite = await promptYesNo("Do you want to overwrite it? (y/N): ");
    if (!overwrite) {
      console.log("Setup cancelled.");
      return;
    }
  }

  // Get API key
  console.log("\nEnter your OpenRouter API key:");
  const apiKey = await promptInput("> ");

  if (!apiKey.trim()) {
    console.log("\n\x1b[31mAPI key is required. Setup cancelled.\x1b[0m");
    return;
  }

  // Write .env file
  try {
    await Bun.write(".env", `OPENROUTER_API_KEY=${apiKey.trim()}\n`);
    console.log("\n\x1b[32m✓ API key saved to .env\x1b[0m");
  } catch (error) {
    console.log(`\n\x1b[31m✗ Failed to save API key: ${error}\x1b[0m`);
    return;
  }

  // Initialize chat history file
  try {
    await Bun.write(HISTORY_FILE, JSON.stringify([], null, 2));
    console.log(`\x1b[32m✓ Chat history file initialized: ${HISTORY_FILE}\x1b[0m`);
  } catch (error) {
    console.log(`\n\x1b[31m✗ Failed to initialize chat history: ${error}\x1b[0m`);
  }

  console.log(`
\x1b[32mSetup complete! You can now use Zest.\x1b[0m
\x1b[33mNote: For security, make sure to add .env to your .gitignore file.\x1b[0m
`);
}

/**
 * Prompt for yes/no input
 */
async function promptYesNo(question: string): Promise<boolean> {
  const answer = await promptInput(question);
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
}

/**
 * Prompt for text input
 */
function promptInput(question: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(question);
    const onData = (data: Buffer) => {
      process.stdin.removeListener('data', onData);
      resolve(data.toString().trim());
    };
    process.stdin.on('data', onData);
  });
}

/**
 * Main CLI loop
 */
async function main() {
  // Load chat history
  loadChatHistory();

  // Check if .env exists, if not prompt for setup
  let envExists = false;
  try {
    // Check for both .env and .env.local
    envExists = await Bun.file(".env").exists() || await Bun.file(".env.local").exists();
  } catch (error) {
    // File doesn't exist
  }

  if (!envExists) {
    console.log("\x1b[33mNo .env file found. Running setup wizard...\x1b[0m");
    await runSetupWizard();
  }

  console.log(`
\x1b[1mZest - AI Assistant\x1b[0m
Type your questions or commands. Use '/help' for available commands.
Type 'exit' or 'quit' to end the session.
`);

  // Main interaction loop
  while (true) {
    try {
      // Get user input
      const input = await promptInput("\nWhat would you like to do? (Type 'exit' or 'quit' to stop, '/' for commands): ");

      // Handle empty input
      if (!input) continue;

      // Handle special commands
      if (input.startsWith("/")) {
        const command = input.toLowerCase();
        if (command === SPECIAL_COMMANDS.help) {
          showHelp();
          continue;
        } else if (command === SPECIAL_COMMANDS.feedback) {
          showFeedback();
          continue;
        } else if (command === SPECIAL_COMMANDS.setup) {
          await runSetupWizard();
          continue;
        }
      }

      // Handle exit commands
      const lowerInput = input.toLowerCase();
      if (SPECIAL_COMMANDS.exit.includes(lowerInput)) {
        console.log("\nGoodbye! Your chat history has been saved.\n");
        break;
      }

       // Process normal input with agent
       startThinkingAnimation();
       addToHistory("user", input);

       try {
         // Invoke the agent
         const result = await agent.invoke({ input });
         stopThinkingAnimation();

         // Debug: Log the result structure
         // console.log('DEBUG: Agent result:', JSON.stringify(result, null, 2));

         // Extract response (adjust based on actual agent response format)
         let response = "";
         if (result && typeof result === 'object') {
           // Handle LangChain agent result format
           if ('messages' in result && Array.isArray(result.messages) && result.messages.length > 0) {
             const lastMessage = result.messages[result.messages.length - 1];
             if (lastMessage && typeof lastMessage === 'object' && 'kwargs' in lastMessage && 'content' in lastMessage.kwargs) {
               response = String(lastMessage.kwargs.content);
             } else if ('content' in lastMessage) {
               response = String(lastMessage.content);
             } else {
               response = String(lastMessage);
             }
           } else if ('output' in result) {
             response = String(result.output);
           } else if ('content' in result) {
             response = String(result.content);
           } else if ('text' in result) {
             response = String(result.text);
           } else {
             // Fallback: try to stringify and extract meaningful content
             response = String(result);
           }
         } else {
           response = String(result);
         }

         // Format and display response
         const formattedResponse = formatMarkdownLike(response);
         console.log(`\n\x1b[1m--- Zest ---\x1b[0m\n${formattedResponse}\n`);

         // Add to history
         addToHistory("assistant", response);
       } catch (error: any) {
         stopThinkingAnimation();
         console.log(`\n\x1b[31mError: ${error.message}\x1b[0m\n`);
         addToHistory("assistant", `Error: ${error.message}`);
       }
    } catch (error: any) {
      // Handle unexpected errors in the main loop
      console.log(`\n\x1b[31mUnexpected error: ${error.message}\x1b[0m\n`);
      // Continue the loop instead of crashing
    }
  }
}

// Start the application
main().catch((error) => {
  console.error("\x1b[31mFatal error:", error, "\x1b[0m");
  process.exit(1);
});
