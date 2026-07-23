"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FaqService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const faq_entity_1 = require("../entities/faq.entity");
let FaqService = class FaqService {
    constructor(faqRepository) {
        this.faqRepository = faqRepository;
    }
    async onModuleInit() {
        const count = await this.faqRepository.count();
        if (count === 0) {
            console.log('[FaqService] No FAQs found. Seeding default FAQ entries...');
            const defaultFaqs = [
                {
                    question: 'How do I place an order?',
                    answer: 'To place an order, browse our products, add your desired items to the cart, click on the cart icon to go to checkout, enter your delivery address, choose your payment method (COD or online payment), and click "Place Order".',
                    category: 'Ordering',
                    isActive: true,
                },
                {
                    question: 'How can I track my order?',
                    answer: 'You can easily track your order! Go to your Profile and click on "My Orders". Select the specific order you want to track to view its current status and updates.',
                    category: 'Shipping',
                    isActive: true,
                },
                {
                    question: 'How do I request a refund?',
                    answer: 'If you want a refund, open a support ticket to "Admin Support" with the category "Refund / Returns", select the relevant order, and explain the reason for your refund. Our support team will review it and process your refund within 3-5 business days.',
                    category: 'Refunds',
                    isActive: true,
                },
                {
                    question: 'How do I contact a seller?',
                    answer: 'To contact a seller, go to the Support Center, click "New Support Ticket", choose "Vendor Support", select the product or order you have an issue with, write your query, and submit. The seller will reply to you directly in the ticket chat thread.',
                    category: 'Seller',
                    isActive: true,
                },
                {
                    question: 'What if I receive a damaged product?',
                    answer: 'If you receive a damaged product, please submit a Vendor Support ticket immediately. Link the product and order, describe the issue, and attach photos of the damage. The seller will verify your claim and coordinate a replacement or refund.',
                    category: 'Product',
                    isActive: true,
                },
                {
                    question: 'How can I cancel an order?',
                    answer: 'You can cancel your order before it has been shipped. Go to "My Orders", select the order, and click "Cancel Order". If the order has already been shipped, you will need to initiate a return request after delivery.',
                    category: 'Ordering',
                    isActive: true,
                },
                {
                    question: 'How long does delivery take?',
                    answer: 'Standard delivery takes 3 to 5 business days depending on your delivery address and location. You can view the estimated delivery time on the product detail page or track it in your "My Orders" tab.',
                    category: 'Shipping',
                    isActive: true,
                },
                {
                    question: 'How do I update my account information?',
                    answer: 'To update your account information, navigate to your Profile page. You can edit your name, email address, profile picture, shipping address, and password directly from there.',
                    category: 'Account',
                    isActive: true,
                },
            ];
            for (const faq of defaultFaqs) {
                await this.faqRepository.save(this.faqRepository.create(faq));
            }
            console.log('[FaqService] Default FAQ entries seeded successfully.');
        }
    }
    async findAllActive(category) {
        const query = { isActive: true };
        if (category && category !== 'All') {
            query.category = category;
        }
        return this.faqRepository.find({
            where: query,
            order: { createdAt: 'DESC' },
        });
    }
    async findAll() {
        return this.faqRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const faq = await this.faqRepository.findOne({ where: { id } });
        if (!faq) {
            throw new common_1.NotFoundException(`FAQ with ID "${id}" not found`);
        }
        return faq;
    }
    async create(createFaqDto) {
        const faq = this.faqRepository.create(createFaqDto);
        return this.faqRepository.save(faq);
    }
    async update(id, updateFaqDto) {
        const faq = await this.findOne(id);
        Object.assign(faq, updateFaqDto);
        return this.faqRepository.save(faq);
    }
    async remove(id) {
        const faq = await this.findOne(id);
        await this.faqRepository.remove(faq);
    }
};
exports.FaqService = FaqService;
exports.FaqService = FaqService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(faq_entity_1.FAQ)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], FaqService);
//# sourceMappingURL=faq.service.js.map