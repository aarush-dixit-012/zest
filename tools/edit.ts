/**
 * Performs exact string replacements in files.
 * 
 * Usage:
 * - You must read the file first (using readFile tool) before editing.
 * - When editing text from Read tool output, ensure you preserve the exact indentation.
 * - Only use emojis if explicitly requested.
 * - The edit will FAIL if `oldString` is not found in the file.
 * - The edit will FAIL if `oldString` is found multiple times unless you provide more context or use replaceAll.
 */
export async function editTool(filePath: string, oldString: string, newString: string, replaceAll = false): Promise<string> {
  try {
    // Make sure filePath is absolute
    if (!filePath.startsWith('/')) {
      filePath = process.cwd() + '/' + filePath;
    }
    
    // Read the file content
    const content = await Bun.file(filePath).text();
    
    if (!content.includes(oldString)) {
      throw new Error(`oldString not found in content of ${filePath}`);
    }
    
    // Count occurrences to check for multiple matches
    const matches = content.split(oldString).length - 1;
    if (matches > 1 && !replaceAll) {
      throw new Error(`Found ${matches} matches for oldString in ${filePath}. Provide more surrounding lines or set replaceAll to true.`);
    }
    
    let newContent;
    if (replaceAll) {
      newContent = content.split(oldString).join(newString);
    } else {
      newContent = content.replace(oldString, newString);
    }
    
    // Write the file back
    await Bun.write(filePath, newContent);
    
    return `Successfully edited ${filePath}`;
  } catch (error: any) {
    throw new Error(`Edit error: ${error.message}`);
  }
}
