import { isAbsolute, join } from 'path';

export class PathUtil {
  constructor(private srcDir: string, private outputDir: string) {
    if (!isAbsolute(srcDir)) {
      this.srcDir = join(process.cwd(), srcDir);
    }
    if (!isAbsolute(outputDir)) {
      this.outputDir = join(process.cwd(), outputDir);
    }
  }
  getSrcDir = () => this.srcDir;
  getOutputDir = () => this.outputDir;
}
