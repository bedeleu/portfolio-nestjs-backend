// src/works/works.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { Work } from './work.entity';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorksService {
  private works: Work[] = [];
  private readonly dbPath = path.join(process.cwd(), 'data', 'works.json');
  private readonly uploadsPath = path.join(process.cwd(), 'uploads');

  constructor() {
    this.ensureDirectoriesExist();
    this.loadWorks();
  }

  private ensureDirectoriesExist() {
    if (!fs.existsSync(path.dirname(this.dbPath))) {
      fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
    }
    if (!fs.existsSync(this.uploadsPath)) {
      fs.mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  private loadWorks() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        const parsedData = JSON.parse(data);
        this.works = parsedData.works || [];
      }
    } catch (error) {
      console.error('Error loading works:', error);
      this.works = [];
    }
  }

  private saveWorks() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify({ works: this.works }, null, 2));
    } catch (error) {
      console.error('Error saving works:', error);
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
    const newWork: Work = {
      ...createWorkDto,
      id: Math.max(0, ...this.works.map(w => w.id)) + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.works.push(newWork);
    this.saveWorks();
    return newWork;
  }

  async update(id: number, updateWorkDto: Partial<Work>): Promise<Work> {
    const index = this.works.findIndex(work => work.id === id);
    if (index === -1) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    const updatedWork = {
      ...this.works[index],
      ...updateWorkDto,
      updatedAt: new Date(),
    };

    this.works[index] = updatedWork;
    this.saveWorks();
    return updatedWork;
  }

  async remove(id: number): Promise<void> {
    const index = this.works.findIndex(work => work.id === id);
    if (index === -1) {
      throw new NotFoundException(`Work with ID ${id} not found`);
    }

    this.works.splice(index, 1);
    this.saveWorks();
  }

  async uploadImage(file: Express.Multer.File): Promise<string> {
    const filename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filepath = path.join(this.uploadsPath, filename);

    await fs.promises.writeFile(filepath, file.buffer);
    return `/uploads/${filename}`;
  }
}