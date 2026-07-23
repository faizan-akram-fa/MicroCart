import { ProductService } from '../services/product.service';
import { SearchProductDto } from '../dto/product.dto';
export declare class ProductController {
    private productService;
    constructor(productService: ProductService);
    create(body: any, files: Array<any>, req: any): Promise<import("../entities/product.entity").Product>;
    createBulk(products: any[], req: any): Promise<import("../entities/product.entity").Product[]>;
    findAll(searchDto: SearchProductDto): Promise<{
        products: import("../entities/product.entity").Product[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findBySeller(req: any): Promise<import("../entities/product.entity").Product[]>;
    findOne(id: string): Promise<import("../entities/product.entity").Product>;
    update(id: string, body: any, files: Array<any>, req: any): Promise<import("../entities/product.entity").Product>;
    remove(id: string, req: any): Promise<{
        message: string;
    }>;
    updateStock(id: string, quantity: number, isSet?: boolean): Promise<import("../entities/product.entity").Product>;
    getAdminInventory(req: any): Promise<import("../entities/product.entity").Product[]>;
    uploadBulkImages(files: Array<any>): Promise<{
        originalName: any;
        url: string;
    }[]>;
}
