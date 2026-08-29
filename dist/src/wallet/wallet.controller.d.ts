import { WalletService } from './wallet.service';
/** Exposes the wallet API surface. */
export declare class WalletController {
    private readonly service;
    constructor(service: WalletService);
    status(): {
        module: string;
        status: string;
    };
    getBalance(publicKey: string): Promise<unknown[]>;
}
