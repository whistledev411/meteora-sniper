import { struct, u32, u8 } from '@solana/buffer-layout';
import { bool, publicKey, u64 } from '@solana/buffer-layout-utils';
import { Connection, PublicKey } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import { getPdaMetadataKey } from '@raydium-io/raydium-sdk';
import { MetadataAccountData, MetadataAccountDataArgs, getMetadataAccountDataSerializer } from '@metaplex-foundation/mpl-token-metadata';

/** Information about a mint */
export interface Mint {
    /** Address of the mint */
    address: PublicKey;
    /**
     * Optional authority used to mint new tokens. The mint authority may only be provided during mint creation.
     * If no mint authority is present then the mint has a fixed supply and no further tokens may be minted.
     */
    mintAuthority: PublicKey | null;
    /** Total supply of tokens */
    supply: bigint;
    /** Number of base 10 digits to the right of the decimal place */
    decimals: number;
    /** Is this mint initialized */
    isInitialized: boolean;
    /** Optional authority to freeze token accounts */
    freezeAuthority: PublicKey | null;
}


/**
 * Checks if a token mint authority is renounced
 * @param connection - Solana connection
 * @param vault - Token mint address
 * @returns True if mint authority is renounced (mintAuthorityOption === 0), undefined on error
 */
export async function checkMintable(connection: Connection, vault: PublicKey): Promise<boolean | undefined> {
    try {
        const accountInfo = await connection.getAccountInfo(vault);
        if (!accountInfo?.data) {
            return undefined;
        }
        const deserialize = MintLayout.decode(accountInfo.data);
        return deserialize.mintAuthorityOption === 0;
    } catch (e) {
        console.log(`Failed to check if mint is renounced:`, vault.toBase58(), e);
        return undefined;
    }
}


export const checkMutable = async (baseMint: PublicKey,) => {
    try {
        const metadataPDA = getPdaMetadataKey(baseMint);
        const metadataAccount = await solanaConnection.getAccountInfo(metadataPDA.publicKey);
        if (!metadataAccount?.data) {
            return { ok: false, message: 'Mutable -> Failed to fetch account data' };
        }
        const serializer = getMetadataAccountDataSerializer()
        const deserialize = serializer.deserialize(metadataAccount.data);
        const mutable = deserialize[0].isMutable;

        return !mutable
    } catch (e: any) {
        return false
    }
}
export const checkBurn = async (lpMint: PublicKey): Promise<boolean> {
    try {
        const amount = await solanaConnection.getTokenSupply(lpMint, 'confirmed');
        const burned = amount.value.uiAmount === 0;
        return burned;
    } catch (error) {
        console.log(`Failed to check LP burn status for mint:`, lpMint.toBase58(), error);
        return false;
    }
}

export async function checkFreezeAuthority(mintPublicKey: PublicKey) {
    // Fetch the mint account info
    const mintAccountInfo = await solanaConnection.getAccountInfo(mintPublicKey);

    if (!mintAccountInfo) {
        throw new Error('Mint account not found');
    }

    // Parse the mint account data
    const mintData = parseMintAccountData(mintAccountInfo.data);
    console.log("🚀 ~ checkFreezeAuthority ~ mintData:", mintData)

    // Check if the freeze authority is set
    if (mintData.freezeAuthority) {
        console.log(`Freeze Authority: ${mintData.freezeAuthority.toBase58()}`);
        return true
    } else {
        return false
    }
}

export async function getFreezeAuthority(mint: PublicKey): Promise<boolean> {
    try {
        const mintAccountInfo = await solanaConnection.getAccountInfo(mint);
        if (!mintAccountInfo?.data) {
            return false;
        }
        const mintData = MintLayout.decode(mintAccountInfo.data);
        return mintData.freezeAuthorityOption === 1;
    } catch (error) {
        console.log(`Failed to check freeze authority for mint:`, mint.toBase58(), error);
        return false;
    }
}


export const checkTicker = async (connection: Connection, baseMint: PublicKey, keyword: string): Promise<boolean> => {
    try {
      const serializer = getMetadataAccountDataSerializer();
      const metadataPDA = getPdaMetadataKey(baseMint);
      const metadataAccount = await connection.getAccountInfo(metadataPDA.publicKey, 'confirmed');
      if (!metadataAccount?.data) {
        console.log(`Failed to fetch metadata account for mint:`, baseMint.toBase58());
        return false;
      }
  
      const deserialize = serializer.deserialize(metadataAccount.data);
      if (!deserialize[0]?.uri) {
        console.log(`No URI found in metadata for mint:`, baseMint.toBase58());
        return false;
      }

      const response = await fetch(deserialize[0].uri);
      if (!response.ok) {
        console.log(`Failed to fetch token metadata from URI:`, deserialize[0].uri);
        return false;
      }

      const data = await response.json();
      console.log("Token Symbol : ", `$${data.symbol}`);
      console.log("Token Name : ", data.name);
      
      const upperKeyword = keyword.toUpperCase();
      const symbolMatch = data.symbol?.toUpperCase().indexOf(upperKeyword) > -1;
      const nameMatch = data.name?.toUpperCase().indexOf(upperKeyword) > -1;
      
      return symbolMatch || nameMatch;
    } catch (error) {
      console.log(`Error checking ticker for mint:`, baseMint.toBase58(), error);
      return false;
    }
  }

// Helper function to parse mint account data
function parseMintAccountData(data: Buffer) {
    // Mint account layout (simplified for this example)
    const mintLayout = {
        mintAuthorityOption: 0,
        mintAuthority: 1,
        supply: 9,
        decimals: 17,
        isInitialized: 18,
        freezeAuthorityOption: 19,
        freezeAuthority: 20,
    };

    const mintAuthorityOption = data.readUInt32LE(mintLayout.mintAuthorityOption);
    const freezeAuthorityOption = data.readUInt32LE(mintLayout.freezeAuthorityOption);

    return {
        mintAuthority: mintAuthorityOption ? new PublicKey(data.slice(mintLayout.mintAuthority, mintLayout.mintAuthority + 32)) : null,
        supply: data.readBigUInt64LE(mintLayout.supply),
        decimals: data[mintLayout.decimals],
        isInitialized: !!data[mintLayout.isInitialized],
        freezeAuthority: freezeAuthorityOption ? new PublicKey(data.slice(mintLayout.freezeAuthority, mintLayout.freezeAuthority + 32)) : null,
    };
}
