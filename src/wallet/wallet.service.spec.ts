import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletEntity } from './entities/wallet.entity';

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_KEY = 'GOSH22L6WXXYMMEPV35MP2BECFJTDCLPMEEQ4AF4R4K3NJ3GQQDSTK42';
const USER_A = 'user-a-uuid';
const USER_B = 'user-b-uuid';

/** Builds a minimal WalletEntity stub. */
function makeWallet(overrides: Partial<WalletEntity> = {}): WalletEntity {
  return {
    id: 'wallet-uuid',
    userId: USER_A,
    publicKey: VALID_KEY,
    spendingLimitXlm: null,
    spendingLimitUsdc: null,
    spendingLimitEurc: null,
    createdAt: new Date(),
    ...overrides,
  } as WalletEntity;
}

// ── Re-usable factory ─────────────────────────────────────────────────────────

function makeService(opts: {
  walletFindOne?: jest.Mock;
  walletCreate?: jest.Mock;
  walletSave?: jest.Mock;
  txQueryBuilder?: jest.Mock;
  blockchainGetBalances?: jest.Mock;
}) {
  const walletRepo = {
    findOne: opts.walletFindOne ?? jest.fn().mockResolvedValue(null),
    create: opts.walletCreate ?? jest.fn().mockImplementation((data) => ({ ...data })),
    save: opts.walletSave ?? jest.fn().mockImplementation((e) => Promise.resolve({ id: 'new-uuid', ...e })),
  };

  const txRepo = {
    createQueryBuilder: opts.txQueryBuilder ?? jest.fn(),
  };

  const blockchain = {
    getBalances: opts.blockchainGetBalances ?? jest.fn().mockResolvedValue([]),
  };

  const service = new WalletService(
    walletRepo as unknown as Parameters<typeof WalletService['prototype']['linkWallet']> extends never ? never : never,
    txRepo as never,
    blockchain as never,
    {} as never,
  );

  return { service, walletRepo, txRepo, blockchain };
}

// ── linkWallet ────────────────────────────────────────────────────────────────

describe('WalletService.linkWallet', () => {
  it('rejects an invalid Stellar public key', async () => {
    const { service } = makeService({});
    await expect(service.linkWallet(USER_A, 'NOTAKEY')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a key that starts with the right letter but is the wrong length', async () => {
    const { service } = makeService({});
    await expect(service.linkWallet(USER_A, 'GABC')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('creates a new wallet record for a fresh key', async () => {
    const saved = makeWallet();
    const walletSave = jest.fn().mockResolvedValue(saved);
    const walletCreate = jest.fn().mockReturnValue({ userId: USER_A, publicKey: VALID_KEY });
    const walletFindOne = jest.fn().mockResolvedValue(null);

    const { service } = makeService({ walletFindOne, walletCreate, walletSave });
    const result = await service.linkWallet(USER_A, VALID_KEY);

    expect(walletFindOne).toHaveBeenCalledWith({ where: { publicKey: VALID_KEY } });
    expect(walletCreate).toHaveBeenCalledWith({ userId: USER_A, publicKey: VALID_KEY });
    expect(walletSave).toHaveBeenCalled();
    expect(result).toBe(saved);
  });

  it('returns the existing record when the same user re-links their key (idempotent)', async () => {
    const existing = makeWallet({ userId: USER_A });
    const walletFindOne = jest.fn().mockResolvedValue(existing);
    const walletSave = jest.fn();

    const { service } = makeService({ walletFindOne, walletSave });
    const result = await service.linkWallet(USER_A, VALID_KEY);

    expect(result).toBe(existing);
    expect(walletSave).not.toHaveBeenCalled();
  });

  it('throws ConflictException when another user already owns the key', async () => {
    const existing = makeWallet({ userId: USER_B });
    const walletFindOne = jest.fn().mockResolvedValue(existing);

    const { service } = makeService({ walletFindOne });
    await expect(service.linkWallet(USER_A, VALID_KEY)).rejects.toBeInstanceOf(ConflictException);
  });
});

// ── getBalances ───────────────────────────────────────────────────────────────

describe('WalletService.getBalances', () => {
  it('throws NotFoundException when no wallet is linked', async () => {
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(null) });
    await expect(service.getBalances(USER_A)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('delegates to BlockchainService using the stored public key', async () => {
    const balances = [{ asset_type: 'native', balance: '100.0000000' }];
    const walletFindOne = jest.fn().mockResolvedValue(makeWallet());
    const blockchainGetBalances = jest.fn().mockResolvedValue(balances);

    const { service } = makeService({ walletFindOne, blockchainGetBalances });
    const result = await service.getBalances(USER_A);

    expect(blockchainGetBalances).toHaveBeenCalledWith(VALID_KEY);
    expect(result).toBe(balances);
  });
});

// ── setSpendingLimit ──────────────────────────────────────────────────────────

describe('WalletService.setSpendingLimit', () => {
  it('throws NotFoundException when no wallet is linked', async () => {
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(null) });
    await expect(service.setSpendingLimit(USER_A, 'USDC', '100')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a zero limit', async () => {
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(makeWallet()) });
    await expect(service.setSpendingLimit(USER_A, 'USDC', '0')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a non-numeric limit', async () => {
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(makeWallet()) });
    await expect(service.setSpendingLimit(USER_A, 'XLM', 'abc')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores the USDC limit on the wallet record', async () => {
    const wallet = makeWallet();
    const walletFindOne = jest.fn().mockResolvedValue(wallet);
    const saved = { ...wallet, spendingLimitUsdc: '200' };
    const walletSave = jest.fn().mockResolvedValue(saved);

    const { service } = makeService({ walletFindOne, walletSave });
    const result = await service.setSpendingLimit(USER_A, 'USDC', '200');

    expect(walletSave).toHaveBeenCalled();
    expect(result.spendingLimitUsdc).toBe('200');
  });

  it('stores the XLM limit on the wallet record', async () => {
    const wallet = makeWallet();
    const walletFindOne = jest.fn().mockResolvedValue(wallet);
    const saved = { ...wallet, spendingLimitXlm: '500' };
    const walletSave = jest.fn().mockResolvedValue(saved);

    const { service } = makeService({ walletFindOne, walletSave });
    const result = await service.setSpendingLimit(USER_A, 'XLM', '500');

    expect(result.spendingLimitXlm).toBe('500');
  });
});

// ── checkSpendingLimit ────────────────────────────────────────────────────────

/** Builds a chainable query-builder mock that returns a raw result. */
function makeQb(rawResult: { sum: string }) {
  const qb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn().mockResolvedValue(rawResult),
  };
  return jest.fn().mockReturnValue(qb);
}

describe('WalletService.checkSpendingLimit', () => {
  it('throws NotFoundException when no wallet is linked', async () => {
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(null) });
    await expect(service.checkSpendingLimit(USER_A, 'USDC', '50')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws BadRequestException for an unsupported asset', async () => {
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(makeWallet()) });
    await expect(service.checkSpendingLimit(USER_A, 'DOGE', '10')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws BadRequestException for a non-positive amount', async () => {
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(makeWallet()) });
    await expect(service.checkSpendingLimit(USER_A, 'USDC', '0')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns allowed:true and remaining:unlimited when no limit is configured', async () => {
    const wallet = makeWallet({ spendingLimitUsdc: null });
    const { service } = makeService({ walletFindOne: jest.fn().mockResolvedValue(wallet) });

    const result = await service.checkSpendingLimit(USER_A, 'USDC', '9999');
    expect(result).toEqual({ allowed: true, remaining: 'unlimited' });
  });

  it('returns allowed:true when spend + proposed is within the limit', async () => {
    const wallet = makeWallet({ spendingLimitUsdc: '200' });
    const walletFindOne = jest.fn().mockResolvedValue(wallet);
    const txQueryBuilder = makeQb({ sum: '100' }); // already spent 100

    const { service } = makeService({ walletFindOne, txQueryBuilder });
    const result = await service.checkSpendingLimit(USER_A, 'USDC', '50');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe('100.000000000000'); // 200 - 100
  });

  it('returns allowed:false when spend + proposed exceeds the limit', async () => {
    const wallet = makeWallet({ spendingLimitUsdc: '200' });
    const walletFindOne = jest.fn().mockResolvedValue(wallet);
    const txQueryBuilder = makeQb({ sum: '180' }); // already spent 180

    const { service } = makeService({ walletFindOne, txQueryBuilder });
    const result = await service.checkSpendingLimit(USER_A, 'USDC', '9999');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe('20.000000000000'); // 200 - 180
  });

  it('returns allowed:false and remaining:0 when limit is fully exhausted', async () => {
    const wallet = makeWallet({ spendingLimitUsdc: '200' });
    const walletFindOne = jest.fn().mockResolvedValue(wallet);
    const txQueryBuilder = makeQb({ sum: '200' });

    const { service } = makeService({ walletFindOne, txQueryBuilder });
    const result = await service.checkSpendingLimit(USER_A, 'USDC', '1');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe('0.000000000000');
  });

  it('is case-insensitive for the asset parameter', async () => {
    const wallet = makeWallet({ spendingLimitUsdc: '100' });
    const walletFindOne = jest.fn().mockResolvedValue(wallet);
    const txQueryBuilder = makeQb({ sum: '0' });

    const { service } = makeService({ walletFindOne, txQueryBuilder });
    const result = await service.checkSpendingLimit(USER_A, 'usdc', '50');

    expect(result.allowed).toBe(true);
  });
});
