import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { WalletService } from "./wallet.service";
import { Wallet } from "./wallet.entity";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("WalletService", () => {
  let service: WalletService;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockServer = {
    loadAccount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: getRepositoryToken(Wallet),
          useValue: mockRepository,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const validPublicKey =
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

  it("should return cached balances if available", async () => {
    const cachedBalances = [{ asset: "XLM", balance: "100" }];

    mockCacheManager.get.mockResolvedValue(cachedBalances);

    const result = await service.getAccountBalances(validPublicKey);

    expect(result).toEqual(cachedBalances);
    expect(mockCacheManager.get).toHaveBeenCalled();
  });

  it("should fetch balances from Stellar if cache is empty", async () => {
    mockCacheManager.get.mockResolvedValue(null);

    jest.spyOn((service as any).server, "loadAccount").mockResolvedValue({
      balances: [
        {
          asset_type: "native",
          balance: "50",
        },
      ],
    });

    const result = await service.getAccountBalances(validPublicKey);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ asset: "XLM", balance: "50" }),
      ]),
    );

    expect(mockCacheManager.set).toHaveBeenCalled();
  });

  it("should throw BadRequestException for invalid public key", async () => {
    await expect(service.getAccountBalances("invalid-key")).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw NotFoundException when Stellar account not found', async () => {
  mockCacheManager.get.mockResolvedValue(null);

  jest.spyOn((service as any).server, 'loadAccount').mockRejectedValue({
    response: { status: 404 },
  });

  await expect(service.getAccountBalances(validPublicKey)).rejects.toThrow(
    NotFoundException,
  );
});

  it("should include missing supported assets with zero balance", async () => {
    mockCacheManager.get.mockResolvedValue(null);

    mockServer.loadAccount.mockResolvedValue({
      balances: [
        {
          asset_type: "native",
          balance: "10",
        },
      ],
    });

    const result = await service.getAccountBalances(validPublicKey);

    const usdc = result.find((b) => b.asset === "USDC");
    const eurc = result.find((b) => b.asset === "EURC");

    expect(usdc?.balance).toBe("0.0000000");
    expect(eurc?.balance).toBe("0.0000000");
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createWallet", () => {
    it("should create and save a wallet", async () => {
      const publicKey = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const mockWallet = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        publicKey,
        userId,
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockWallet);
      mockRepository.save.mockResolvedValue(mockWallet);

      const result = await service.createWallet(publicKey, userId);

      expect(mockRepository.create).toHaveBeenCalledWith({ publicKey, userId });
      expect(mockRepository.save).toHaveBeenCalledWith(mockWallet);
      expect(result).toEqual(mockWallet);
    });
  });

  describe("findByUserId", () => {
    it("should return wallets for a user", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const mockWallets = [
        {
          id: "123e4567-e89b-12d3-a456-426614174001",
          publicKey: "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
          userId,
          createdAt: new Date(),
        },
      ];

      mockRepository.find.mockResolvedValue(mockWallets);

      const result = await service.findByUserId(userId);

      expect(mockRepository.find).toHaveBeenCalledWith({ where: { userId } });
      expect(result).toEqual(mockWallets);
    });
  });

  describe("findByPublicKey", () => {
    it("should return a wallet by public key", async () => {
      const publicKey = "GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX";
      const mockWallet = {
        id: "123e4567-e89b-12d3-a456-426614174001",
        publicKey,
        userId: "123e4567-e89b-12d3-a456-426614174000",
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockWallet);

      const result = await service.findByPublicKey(publicKey);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { publicKey },
      });
      expect(result).toEqual(mockWallet);
    });

    it("should return null if wallet not found", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByPublicKey("NONEXISTENT");

      expect(result).toBeNull();
    });
  });

  describe("getStatus", () => {
    it("should return module status", () => {
      const result = service.getStatus();
      expect(result).toEqual({ module: "Wallet", status: "Working" });
    });
  });
});
