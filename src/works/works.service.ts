import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Work } from './work.entity';
import * as fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { createPathConfig } from '../config/paths.config';

@Injectable()
export class WorksService {
  private works: Work[] = [];
  private readonly paths: ReturnType<typeof createPathConfig>;

  constructor(private configService: ConfigService) {
    const isProduction = this.configService.get('nodeEnv') === 'production';
    this.paths = createPathConfig(isProduction);
    this.initialize();
  }

  private async initialize() {
    try {
      await this.ensureDirectoriesExist();
      await this.loadWorks();
    } catch (error) {
      console.error('Failed to initialize WorksService:', error);
      throw new InternalServerErrorException('Service initialization failed');
    }
  }

  private async ensureDirectoriesExist() {
    try {
      // Asigură-te că directoarele există
      const dirsToCreate = [
        path.dirname(this.paths.dbFile),
        this.paths.uploadsDir
      ];

      for (const dir of dirsToCreate) {
        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }
      }

      // Inițializează fișierul JSON dacă nu există
      if (!existsSync(this.paths.dbFile)) {
        await fs.writeFile(
          this.paths.dbFile,
          JSON.stringify({ works: [] }, null, 2)
        );
      }
    } catch (error) {
      console.error('Error ensuring directories exist:', error);
      throw new InternalServerErrorException('Failed to create required directories');
    }
  }


  private async loadWorks() {
    try {
      const data = await fs.readFile(this.paths.dbFile, 'utf8');
      const parsedData = JSON.parse(data);
      this.works = Array.isArray(parsedData.works) ? parsedData.works : [];
    } catch (error) {
      console.error('Error loading works:', error);
      this.works = [];
      throw new InternalServerErrorException('Failed to load works data');
    }
  }

  private async saveWorks() {
    const tempPath = `${this.paths.dbFile}.temp`;
    try {
      await fs.writeFile(tempPath, JSON.stringify({ works: this.works }, null, 2));
      await fs.rename(tempPath, this.paths.dbFile);
    } catch (error) {
      console.error('Error saving works:', error);
      throw new InternalServerErrorException('Failed to save works data');
    }
  }

  private validateWork(work: Partial<Work>) {
    if (!work.title?.trim()) {
      throw new Error('Title is required');
    }
    if (!work.description?.trim()) {
      throw new Error('Description is required');
    }
    if (!work.imageUrl?.trim()) {
      throw new Error('Image URL is required');
    }
    if (!work.clientUrl?.trim()) {
      throw new Error('Client URL is required');
    }
  }

  async findAll(): Promise<Work[]> {
    return this.works;
  }

  async findOne(id: number): Promise<Work> {
    const work = this.works.find(work => work.id === id);
    if (!work) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }
    return work;
  }

  async create(createWorkDto: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>): Promise<Work> {
    try {
      this.validateWork(createWorkDto);

      const newWork: Work = {
        ...createWorkDto,
        id: Math.max(0, ...this.works.map(w => w.id)) + 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.works.push(newWork);
      await this.saveWorks();
      return newWork;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to create work: ${error.message}`);
      }
      throw error;
    }
  }

  async update(id: number, updateWorkDto: Partial<Work>): Promise<Work> {
    const index = this.works.findIndex(work => work.id === id);
    if (index === -1) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    try {
      const updatedWork = {
        ...this.works[index],
        ...updateWorkDto,
        updatedAt: new Date(),
      };

      // Validăm doar dacă se actualizează câmpuri relevante
      if (updateWorkDto.title || updateWorkDto.description ||
        updateWorkDto.imageUrl || updateWorkDto.clientUrl) {
        this.validateWork(updatedWork);
      }

      this.works[index] = updatedWork;
      await this.saveWorks();
      return updatedWork;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to update work: ${error.message}`);
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const index = this.works.findIndex(work => work.id === id);
    if (index === -1) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    try {
      // Ștergem și imaginea asociată dacă există și e locală
      const work = this.works[index];
      if (work.imageUrl && !work.imageUrl.startsWith('http')) {
        // Folosim this.paths.uploadsDir în loc de this.uploadsPath
        const imagePath = path.join(this.paths.uploadsDir, path.basename(work.imageUrl));

        // Adăugăm logging pentru debugging
        console.log('Attempting to delete image:', {
          imageUrl: work.imageUrl,
          fullPath: imagePath,
          exists: existsSync(imagePath)
        });

        if (existsSync(imagePath)) {
          await fs.unlink(imagePath);
        }
      }

      this.works.splice(index, 1);
      await this.saveWorks();
    } catch (error) {
      console.error('Error removing work:', {
        workId: id,
        error: error.message,
        stack: error.stack
      });
      throw new InternalServerErrorException(`Failed to remove work: ${error.message}`);
    }
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    try {
      const filename = `${uuidv4()}${path.extname(file.originalname)}`;
      const filepath = path.join(this.paths.uploadsDir, filename);

      await fs.writeFile(filepath, file.buffer);

      const apiUrl = this.configService.get('apiUrl');
      return `${apiUrl}/uploads/${filename}`;
    } catch (error) {
      console.error('Upload error:', error);
      throw new InternalServerErrorException(`Failed to upload image: ${error.message}`);
    }
  }
}