import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Wallet } from "./wallet.entity";
import { Horizon } from "@stellar/stellar-sdk";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";

type HorizonServer = Horizon.Server;

const HORIZON_URL = "https://horizon.stellar.org";
const SUPPORTED_ASSETS = ["XLM", "USDC", "EURC"] as const;

export interface AssetBalance {
  asset: string;
  balance: string;
  assetCode?: string;
  assetIssuer?: string;
}

interface StellarBalance {
  asset_type: string;
  balance: string;
  asset_code?: string;
  asset_issuer?: string;
}

interface StellarAccount {
  balances: StellarBalance[];
}

interface StellarError {
  response?: {
    status?: number;
  };
  message?: string;
}

function isStellarError(err: unknown): err is StellarError {
  return typeof err === "object" && err !== null;
}

@Injectable()
export class WalletService {
  private readonly server: HorizonServer;

  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,

    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {
    this.server = new Horizon.Server(HORIZON_URL);
  }

  async createWallet(publicKey: string, userId: string): Promise<Wallet> {
    const wallet = this.walletRepository.create({ publicKey, userId });
    return await this.walletRepository.save(wallet);
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    return await this.walletRepository.find({ where: { userId } });
  }

  async findByPublicKey(publicKey: string): Promise<Wallet | null> {
    return await this.walletRepository.findOne({ where: { publicKey } });
  }

  public async getAccountBalances(publicKey: string): Promise<AssetBalance[]> {
    const cacheKey = `wallet:balances:${publicKey}`;

    const cachedBalances =
      await this.cacheManager.get<AssetBalance[]>(cacheKey);
    if (cachedBalances) {
      return cachedBalances;
    }

    if (!publicKey || publicKey.length !== 56 || !publicKey.startsWith("G")) {
      throw new BadRequestException("Invalid Stellar public key format");
    }

    let account: StellarAccount;

    try {
      account = (await this.server.loadAccount(
        publicKey,
      )) as unknown as StellarAccount;
    } catch (err: unknown) {
      if (isStellarError(err) && err.response?.status === 404) {
        throw new NotFoundException(
          `Stellar account not found for public key: ${publicKey}`,
        );
      }

      const message =
        isStellarError(err) && err.message ? err.message : "Unknown error";

      throw new BadRequestException(
        `Failed to fetch account from Stellar network: ${message}`,
      );
    }

    const balances: AssetBalance[] = account.balances
      .filter((b: StellarBalance) => {
        if (b.asset_type === "native") return true;

        if (
          b.asset_type === "credit_alphanum4" ||
          b.asset_type === "credit_alphanum12"
        ) {
          return (
            b.asset_code !== undefined &&
            (SUPPORTED_ASSETS as readonly string[]).includes(b.asset_code)
          );
        }

        return false;
      })
      .map((b: StellarBalance): AssetBalance => {
        if (b.asset_type === "native") {
          return { asset: "XLM", balance: b.balance };
        }

        return {
          asset: b.asset_code ?? "",
          balance: b.balance,
          assetCode: b.asset_code,
          assetIssuer: b.asset_issuer,
        };
      });

    for (const symbol of SUPPORTED_ASSETS) {
      if (!balances.find((b) => b.asset === symbol)) {
        balances.push({ asset: symbol, balance: "0.0000000" });
      }
    }

    await this.cacheManager.set(cacheKey, balances, 60);

    return balances;
  }

  getStatus() {
    return { module: "Wallet", status: "Working" };
  }
}
