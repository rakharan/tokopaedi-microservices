import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';
import { ProductService } from '../services/ProductService';

// Point to the shared proto file
const PROTO_PATH = path.join(__dirname, '../../../../shared/src/proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

export class ProductGrpcServer {
    private server: grpc.Server;

    constructor(private productService: ProductService) {
        this.server = new grpc.Server();

        // Bind the implementation to the definition
        this.server.addService(protoDescriptor.product.ProductService.service, {
            DecreaseStock: this.decreaseStock.bind(this),
        });
    }

    async decreaseStock(call: any, callback: any) {
        try {
            const { id, quantity } = call.request;
            console.log(`gRPC DecreaseStock: ID ${id}, Qty ${quantity}`);

            const result = await this.productService.decreaseStock(Number(id), Number(quantity));

            // Send Success Response
            callback(null, {
                success: true,
                price: result.price,
                name: result.name
            });
        } catch (error: any) {
            // Send Error Response
            callback(null, {
                success: false,
                error: error.message
            });
        }
    }

    start(port: string = '50051') {
        this.server.bindAsync(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(`gRPC Server running on port ${port}`);
        });
    }
}