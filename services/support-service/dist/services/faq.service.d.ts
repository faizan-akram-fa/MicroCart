import { OnModuleInit } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FAQ } from '../entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto } from '../dto/faq.dto';
export declare class FaqService implements OnModuleInit {
    private faqRepository;
    constructor(faqRepository: Repository<FAQ>);
    onModuleInit(): Promise<void>;
    findAllActive(category?: string): Promise<FAQ[]>;
    findAll(): Promise<FAQ[]>;
    findOne(id: string): Promise<FAQ>;
    create(createFaqDto: CreateFaqDto): Promise<FAQ>;
    update(id: string, updateFaqDto: UpdateFaqDto): Promise<FAQ>;
    remove(id: string): Promise<void>;
}
