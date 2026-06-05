/**
 * Writes a file to the local filesystem.
 * 
 * Usage:
 * - This tool will overwrite the existing file if there is one at the provided path.
 * - If this is an existing file, you MUST read the file first before writing.
 * - ALWAYS prefer editing existing files in the codebase. NEVER write new files unless explicitly required.
 */
export async function writeTool(filePath: string, content: string): Promise<string> {
  try {
    // Ensure the file path is absolute
    if (!filePath.startsWith('/')) {
      // Make it relative to current directory
      filePath = process.cwd() + '/' + filePath;
    }
    
    await Bun.write(filePath, content);
    return `Successfully wrote to ${filePath}`;
  } catch (error: any) {
    throw new Error(`Write error: ${error.message}`);
  }
}