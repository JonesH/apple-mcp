import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function execute(command: string, args: string[] = []): Promise<string> {
  const { stdout, stderr } = await execAsync(`${command} ${args.join(' ')}`);
  if (stderr) {
    console.error(stderr);
  }
  return stdout;
}
