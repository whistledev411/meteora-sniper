# Meteora Sniper Bot

A high-performance Solana token sniper bot that monitors new Meteora pools in real-time and executes trades based on customizable filtering criteria.

## 🚀 Features

- **Real-time Pool Monitoring**: Uses Yellowstone Geyser gRPC to monitor new Meteora pools as they're created
- **Advanced Filtering**: Multiple filtering options including:
  - Mint authority checks
  - LP burn verification
  - Freeze authority detection
  - Keyword matching (symbol/name)
  - Market cap filtering
  - Liquidity filtering
- **Multiple Execution Methods**: Supports Jito, NextBlock, BloxRoute, and standard Solana transactions
- **Automatic Token Transfer**: Automatically transfers purchased tokens to a secondary wallet
- **SOL Price Tracking**: Real-time SOL price updates for accurate market cap calculations

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- A Solana wallet with SOL for trading
- A Yellowstone Geyser gRPC endpoint (for monitoring new pools)
- A reliable Solana RPC endpoint

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/whistledev411/meteora-sniper.git
cd meteora-sniper
```

2. Install dependencies:
```bash
npm install
```

3. Copy the example environment file:
```bash
# On Windows (PowerShell)
Copy-Item env.example.txt .env

# On Linux/Mac
cp env.example.txt .env
```

4. Configure your `.env` file with your settings (see Configuration section below)

5. Build the project:
```bash
npm run build
```

## ⚙️ Configuration

### Required Environment Variables

- `PRIVATE_KEY`: Your trading wallet's private key (base58 encoded)
- `SECOND_WALLET`: Address of the wallet to transfer tokens to after purchase
- `RPC_ENDPOINT`: Solana RPC endpoint URL
- `GRPC_ENDPOINT`: Yellowstone Geyser gRPC endpoint
- `GRPC_TOKEN`: Authentication token for GRPC endpoint

### Trading Configuration

- `BUY_AMOUNT`: Amount of SOL to spend per trade (default: 0.1)
- `SLIPPAGE`: Slippage tolerance percentage (default: 5)
- `PRIORITY_FEE`: Priority fee in SOL for faster transactions (default: 0.001)

### Filtering Options

Enable/disable various filters:

- `CHECK_IF_MINT_IS_MINTABLE`: Check if mint authority is renounced
- `CHECK_IF_MINT_IS_BURNED`: Check if LP tokens are burned
- `CHECK_IF_MINT_IS_FREEZABLE`: Check if token has freeze authority
- `CHECK_KEYWORD`: Enable keyword filtering
- `KEYWORD`: Keyword to search for in token symbol/name
- `CHECK_MARKET_CAP`: Enable market cap filtering
- `MINIMUM_MARKET_CAP` / `MAXIMUM_MARKET_CAP`: Market cap range in USD
- `CHECK_LIQUIDITY`: Enable liquidity filtering
- `MINIMUM_LIQUIDITY` / `MAXIMUM_LIQUIDITY`: Liquidity range in SOL

### Execution Methods

Choose your preferred transaction execution method:

**Jito Mode:**
- `JITO_MODE=true`
- `JITO_FEE`: Tip amount in SOL

**NextBlock Mode:**
- `NEXTBLOCK_MODE=true`
- `NEXT_BLOCK_API`: Your NextBlock API key
- `NEXT_BLOCK_FEE`: Fee in SOL

**BloxRoute Mode:**
- `BLOXROUTE_MODE=true`
- `BLOXROUTE_FEE`: Fee in SOL
- `BLOXROUTE_AUTH_HEADER`: Your BloxRoute authentication header

**Standard Mode:**
- Set all execution modes to `false` to use standard Solana transactions

## 🎯 Usage

### Development Mode

Run in development mode with TypeScript:
```bash
npm start
```

### Production Mode

Build and run the compiled JavaScript:
```bash
npm run build
npm run jsstart
```

## 📁 Project Structure

```
meteora-sniper/
├── src/
│   ├── config/            # Configuration management
│   │   ├── config.service.ts  # Configuration loading and validation
│   │   └── constants.ts       # Application constants
│   ├── constants/         # Legacy constants (backward compatibility)
│   ├── errors/            # Custom error classes
│   ├── executor/          # Transaction execution methods
│   │   ├── jito.ts        # Jito bundle execution
│   │   ├── bloXroute.ts   # BloxRoute execution
│   │   └── legacy.ts      # Standard transaction execution
│   ├── services/          # Business logic services
│   │   ├── pool.service.ts    # Pool detection and validation
│   │   ├── filter.service.ts  # Token filtering logic
│   │   ├── swap.service.ts    # Swap execution
│   │   ├── stream.service.ts  # Geyser stream management
│   │   └── sniper.service.ts  # Main orchestrator service
│   ├── types/             # TypeScript type definitions
│   ├── utils/
│   │   ├── filters/       # Token filtering functions
│   │   ├── meteoraSwap.ts # Meteora swap logic
│   │   ├── logger.ts      # Logging configuration
│   │   └── utils.ts       # Utility functions
│   ├── idls/              # Anchor IDL files
│   ├── handleSolPrice.ts  # SOL price polling
│   └── index.ts           # Main entry point
├── env.example.txt        # Example environment configuration
├── package.json
├── tsconfig.json
├── README.md
└── CONTRIBUTING.md        # Contribution guidelines
```

## 🔍 How It Works

1. **Initialization**: 
   - Loads and validates configuration from environment variables
   - Initializes Solana connection and wallet
   - Validates RPC connection and wallet balance
   - Starts SOL price polling for market cap calculations

2. **Pool Monitoring**: 
   - Connects to Yellowstone Geyser gRPC stream
   - Monitors transactions involving Meteora program IDs (AMM and Vault)
   - Listens for new pool creation events

3. **Pool Detection**: 
   - Detects `InitializeMint2` instruction in transaction logs
   - Extracts pool address from transaction accounts
   - Fetches pool state from Meteora DYN AMM
   - Verifies it's a SOL/token pair

4. **Filtering**: 
   - Applies configured filters in sequence:
     - Mint authority checks (renounced)
     - LP burn verification
     - Freeze authority checks
     - Keyword matching (symbol/name)
     - Market cap validation
     - Liquidity validation
   - Logs reason for any filter failures

5. **Execution**: 
   - If all filters pass:
     - Calculates swap quote with slippage tolerance
     - Executes swap transaction using selected method (Jito/NextBlock/BloxRoute/Standard)
     - Transfers purchased tokens to secondary wallet
     - Logs transaction signature and Solscan URL

## ⚠️ Important Notes

- **Risk Warning**: Trading cryptocurrencies involves significant risk. Only use funds you can afford to lose.
- **RPC Requirements**: Use a fast, reliable RPC endpoint. Free public RPCs may cause missed opportunities.
- **GRPC Endpoint**: A Yellowstone Geyser endpoint is required for real-time monitoring. Consider using Triton One or similar services.
- **Gas Fees**: Execution methods (Jito, NextBlock, BloxRoute) have additional fees but provide faster execution.
- **Slippage**: Set appropriate slippage tolerance based on market conditions.

## 🐛 Troubleshooting

### Bot not detecting pools
- Verify your GRPC endpoint is working correctly
- Check that your RPC endpoint is responsive
- Ensure you're monitoring the correct program IDs

### Transactions failing
- Check your wallet has sufficient SOL for trades and fees
- Verify slippage settings are appropriate
- Ensure your RPC endpoint is reliable
- Check execution method configuration (Jito/NextBlock/BloxRoute)

### Market cap calculations incorrect
- Verify SOL price polling is working (check `solPrice.json`)
- Ensure pool has sufficient liquidity for accurate calculations

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Disclaimer

This software is provided "as is" without warranty of any kind. Use at your own risk. The authors are not responsible for any losses incurred from using this bot.

