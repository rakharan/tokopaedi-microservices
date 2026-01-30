import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'path';

// Path to the shared proto file we created earlier
const PROTO_PATH = path.join(__dirname, '../../../../shared/src/proto/product.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true
});

const protoDescriptor = grpc.loadPackageDefinition(packageDefinition) as any;

export class ProductClient {
    private client: any;

    constructor(url: string) {
        // Create the connection to Product Service
        this.client = new protoDescriptor.product.ProductService(
            url,
            grpc.credentials.createInsecure()
        );
    }

    // Wraps the callback-based gRPC call in a nice Promise
    decreaseStock(id: number, quantity: number): Promise<{ success: boolean; error?: string; price: number; name: string }> {
        return new Promise((resolve, reject) => {
            this.client.DecreaseStock({ id, quantity }, (err: any, response: any) => {
                if (err) {
                    // Connection error (e.g., Product Service is down)
                    return reject(err);
                }
                if (!response.success) {
                    // Business logic error (e.g., "Insufficient stock")
                    return reject(new Error(response.error));
                }
                resolve(response);
            });
        });
    }
}