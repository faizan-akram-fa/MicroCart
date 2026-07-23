import { FaqService } from '../services/faq.service';
import { CreateFaqDto, UpdateFaqDto } from '../dto/faq.dto';
export declare class FaqController {
    private faqService;
    constructor(faqService: FaqService);
    getActiveFaqs(category?: string): Promise<import("../entities/faq.entity").FAQ[]>;
    getAllFaqs(req: any): Promise<import("../entities/faq.entity").FAQ[]>;
    createFaq(createFaqDto: CreateFaqDto, req: any): Promise<import("../entities/faq.entity").FAQ>;
    updateFaq(id: string, updateFaqDto: UpdateFaqDto, req: any): Promise<import("../entities/faq.entity").FAQ>;
    deleteFaq(id: string, req: any): Promise<{
        message: string;
    }>;
}
