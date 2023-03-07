import { MulterModuleOptions } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { HttpException, HttpStatus } from '@nestjs/common';
import { extname } from 'path';
import * as path from 'path';
import * as fs from 'fs-extra';

const config = new ConfigService();

export const multerConfig = {
    dest: config.get('MULTER_DEST'),
};

export const multerOptions: MulterModuleOptions = {
    limits: {
        fileSize: config.get('MULTER_FILE_SIZE'),
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(csv|json)$/)) {
            cb(null, true);
        } else {
            cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
        }
    },
    storage: diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = './uploads';
            if (!fs.existsSync(uploadPath)) {
                fs.mkdir(uploadPath);
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            const filename = `${Date.now()}-${file.originalname}`;
            cb(null, filename);
        },
    }),
};
