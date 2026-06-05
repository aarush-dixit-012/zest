/**
 * Fast content search tool that works with any codebase size
 * Searches file contents using regular expressions
 * Supports full regex syntax (eg. "log.*Error", "function\s+\w+", etc.)
 * Filter files by pattern with the include parameter (eg. "*.js", "*.{ts,tsx}")
 */
export async function grepTool(pattern: string, path?: string, include?: string): Promise<Array<{file: string; line: number; match: string}>> {
  try {
    // Use Bun.$ to run grep command for better performance
    // Build the grep command
    let cmd = 'grep -rn';
    
    // Add include filter if specified
    if (include) {
      cmd += ` --include="${include}"`;
    }
    
    // Add the pattern and path
    cmd += ` "${pattern}"`;
    
    // Set the path to search in (default to current directory)
    const searchPath = path ?? '.';
    cmd += ` "${searchPath}"`;
    
    // Execute the grep command
    const proc = Bun.spawn(['bash', '-c', cmd]);
    const textOutput = await new Response(proc.stdout).text();
    
    // Parse the output
    const results: Array<{file: string; line: number; match: string}> = [];
    const lines = textOutput.trim().split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      // grep -rn output format: file:line:match
      const parts = line.split(':');
      if (parts.length >= 3) {
        const file = parts[0];
        const lineNum = parseInt(parts[1]);
        const match = parts.slice(2).join(':'); // In case the match contains colons
        
        if (!isNaN(lineNum)) {
          results.push({ file, line: lineNum, match });
        }
      }
    }
    
    return results;
  } catch (error: any) {
    // If grep fails (e.g., no matches), return empty array instead of throwing
    // This matches the expected behavior of search tools
    if (error.message.includes('exit code 1')) {
      return []; // No matches found
    }
    throw new Error(`Grep error: ${error.message}`);
  }
}