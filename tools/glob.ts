import { glob } from 'glob';

/**
 * Fast file pattern matching tool
 */
export async function globTool(pattern: string, path?: string): Promise<string[]> {
  try {
    const options: any = {};
    if (path) {
      options.cwd = path;
    }
    
    const files = await glob(pattern, options);
    return files;
  } catch (error) {
    throw new Error(`Glob error: ${error.message}`);
  }
}
