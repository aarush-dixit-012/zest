/**
 * Launch a new agent to handle complex, multistep tasks autonomously.
 * 
 * When using the Task tool, you must specify a subagent_type parameter to select which agent type to use.
 * 
 * Available agent types:
 * - explore: Fast agent specialized for exploring codebases
 * - general: General-purpose agent for researching complex questions and executing multi-step tasks
 */
export async function taskTool(description: string, prompt: string, subagent_type: string, task_id?: string): Promise<any> {
  try {
    // For now, we'll simulate the task tool by returning a structured response
    // In a full implementation, this would launch a subagent with the specified type
    
    // Validate subagent_type
    const validTypes = ["explore", "general"];
    if (!validTypes.includes(subagent_type)) {
      throw new Error(`Invalid subagent_type: ${subagent_type}. Valid types are: ${validTypes.join(", ")}`);
    }
    
    // Simulate task execution
    const result = {
      task_id: task_id || Math.random().toString(36).substring(2, 9),
      description,
      prompt,
      subagent_type,
      status: "completed",
      result: `Task completed: ${description}\nSubagent type: ${subagent_type}\nPrompt: ${prompt}`
    };
    
    return result;
  } catch (error: any) {
    throw new Error(`Task error: ${error.message}`);
  }
}