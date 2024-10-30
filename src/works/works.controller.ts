import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorksService } from './works.service';
import { Work } from './work.entity';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Express } from 'express';
import { ConfigService } from '@nestjs/config';

interface FileUploadResponse {
  url: string;
}

const imageFileFilter = (req: any, file: Express.Multer.File, callback: Function) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return callback(
      new BadRequestException('Only image files are allowed!'),
      false
    );
  }
  callback(null, true);
};

@Controller('works')
export class WorksController {
  private multerConfig;

  constructor(
    private readonly worksService: WorksService,
    private readonly configService: ConfigService
  ) {
    // Configurare dinamică pentru multer bazată pe environment
    this.multerConfig = {
      storage: diskStorage({
        destination: (req: any, file: Express.Multer.File, callback: Function) => {
          const uploadPath = this.configService.get('UPLOAD_DIR') || './uploads';
          callback(null, uploadPath);
        },
        filename: (req: any, file: Express.Multer.File, callback: Function) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        }
      }),
      fileFilter: imageFileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
      }
    };
  }

  @Get()
  async findAll(): Promise<Work[]> {
    try {
      return await this.worksService.findAll();
    } catch (error) {
      throw new BadRequestException('Could not fetch works');
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Work> {
    const work = await this.worksService.findOne(id);
    if (!work) {
      throw new BadRequestException(`Work with ID ${id} not found`);
    }
    return work;
  }

  @Post()
  async create(
    @Body() createWorkDto: Omit<Work, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Work> {
    try {
      return await this.worksService.create(createWorkDto);
    } catch (error) {
      throw new BadRequestException('Could not create work');
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateWorkDto: Partial<Work>
  ): Promise<Work> {
    try {
      const updatedWork = await this.worksService.update(id, updateWorkDto);
      if (!updatedWork) {
        throw new BadRequestException(`Work with ID ${id} not found`);
      }
      return updatedWork;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Could not update work');
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    try {
      await this.worksService.remove(id);
    } catch (error) {
      throw new BadRequestException(`Could not delete work with ID ${id}`);
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<FileUploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const apiUrl = this.configService.get('API_URL');
    // Asigură-te că URL-ul nu are slash dublu
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      url: fileUrl
    };
  }

  @Patch(':id/toggle-visibility')
  async toggleVisibility(@Param('id', ParseIntPipe) id: number): Promise<Work> {
    try {
      const work = await this.worksService.findOne(id);
      if (!work) {
        throw new BadRequestException(`Work with ID ${id} not found`);
      }

      return await this.worksService.update(id, { isVisible: !work.isVisible });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Could not toggle visibility');
    }
  }
}