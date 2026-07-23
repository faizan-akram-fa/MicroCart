import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQ } from '../entities/faq.entity';
import { CreateFaqDto, UpdateFaqDto } from '../dto/faq.dto';

@Injectable()
export class FaqService implements OnModuleInit {
  constructor(
    @InjectRepository(FAQ)
    private faqRepository: Repository<FAQ>,
  ) {}

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

  async findAllActive(category?: string): Promise<FAQ[]> {
    const query: any = { isActive: true };
    if (category && category !== 'All') {
      query.category = category;
    }
    return this.faqRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<FAQ[]> {
    return this.faqRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<FAQ> {
    const faq = await this.faqRepository.findOne({ where: { id } });
    if (!faq) {
      throw new NotFoundException(`FAQ with ID "${id}" not found`);
    }
    return faq;
  }

  async create(createFaqDto: CreateFaqDto): Promise<FAQ> {
    const faq = this.faqRepository.create(createFaqDto);
    return this.faqRepository.save(faq);
  }

  async update(id: string, updateFaqDto: UpdateFaqDto): Promise<FAQ> {
    const faq = await this.findOne(id);
    Object.assign(faq, updateFaqDto);
    return this.faqRepository.save(faq);
  }

  async remove(id: string): Promise<void> {
    const faq = await this.findOne(id);
    await this.faqRepository.remove(faq);
  }
}

