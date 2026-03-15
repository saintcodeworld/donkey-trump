// ============================================================
// Donkey Kong JS - Solana Wallet Manager
// Uses @solana/web3.js for keypair generation, IndexedDB for storage
// ============================================================

const WalletManager = (() => {
    const DB_NAME = 'DonkeyKongWallets';
    const DB_VERSION = 1;
    const STORE_NAME = 'wallets';

    function openDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    function dbGet(db, id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    function dbPut(db, record) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }

    function checkSolanaLoaded() {
        if (typeof solanaWeb3 === 'undefined' || !solanaWeb3.Keypair) {
            throw new Error('Solana Web3.js failed to load. Please check your internet connection and refresh.');
        }
    }

    // Generate a new Solana keypair using @solana/web3.js
    function generateWallet() {
        checkSolanaLoaded();
        const keypair = solanaWeb3.Keypair.generate();
        const publicKey = keypair.publicKey.toBase58();
        const secretKey = Array.from(keypair.secretKey);
        return { publicKey, secretKey };
    }

    // Get existing wallet from DB
    async function getWallet() {
        const db = await openDB();
        const record = await dbGet(db, 'primary');
        db.close();
        return record;
    }

    // Create and store a new wallet
    async function createWallet() {
        const { publicKey, secretKey } = generateWallet();
        const record = {
            id: 'primary',
            publicKey,
            secretKey,
            createdAt: Date.now()
        };
        const db = await openDB();
        await dbPut(db, record);
        db.close();
        return record;
    }

    // Get the secret key as a base58 string for display
    function getSecretKeyBase58(secretKeyArray) {
        const bytes = new Uint8Array(secretKeyArray);
        return solanaWeb3.bs58 ? solanaWeb3.bs58.encode(bytes) : _toBase58(bytes);
    }

    // Fallback base58 encoder
    function _toBase58(bytes) {
        const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let result = '';
        let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
        while (num > 0n) {
            const rem = num % 58n;
            num = num / 58n;
            result = ALPHABET[Number(rem)] + result;
        }
        for (const b of bytes) {
            if (b === 0) result = '1' + result;
            else break;
        }
        return result;
    }

    return { getWallet, createWallet, getSecretKeyBase58 };
})();
