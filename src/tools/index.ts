import { ToolDefinition } from '@modelcontextprotocol/sdk/server/types';
import pagesTools from './pages';

// Export combined tools array
export const tools: ToolDefinition[] = [
  ...pagesTools,
];

export default tools;