import { join } from 'path';
import { PathConfig } from './types/paths.types';

export const createPathConfig = (isProduction: boolean): PathConfig => {
  const baseDir = isProduction ? join(__dirname, '..', '..') : process.cwd();

  return {
    baseDir,
    dataDir: join(baseDir, 'data'),
    uploadsDir: join(baseDir, 'uploads'),
    dbFile: join(baseDir, 'data', 'works.json')
  };
};